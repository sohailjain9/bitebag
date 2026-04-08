import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const {
      razorpayPaymentId, razorpayOrderId, razorpaySignature,
      dbOrderId, restaurantId,
      restaurantName, restaurantAddress,
      customerName, customerPhone,
      deliveryType, deliveryAddress,
      bagPrice, deliveryFee, totalAmount,
    } = await req.json();

    // Verify signature server-side
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(keySecret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signatureData = `${razorpayOrderId}|${razorpayPaymentId}`;
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signatureData));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, "0")).join("");

    if (expectedSignature !== razorpaySignature) {
      throw new Error("Payment verification failed — invalid signature");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Update order status to confirmed and store payment id
    await supabaseAdmin
      .from("orders")
      .update({
        status: "confirmed",
        stripe_payment_intent_id: razorpayPaymentId,
      })
      .eq("id", dbOrderId);

    // Decrement bags
    await supabaseAdmin.rpc("decrement_bags", { restaurant_uuid: restaurantId });

    // Fetch order number for response
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("order_number, created_at")
      .eq("id", dbOrderId)
      .single();

    // Send WhatsApp notification (fire and forget)
    try {
      const notifUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp-notification`;
      await fetch(notifUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          orderNumber: order?.order_number,
          restaurantName,
          restaurantAddress: restaurantAddress || "",
          customerName: customerName || "Guest",
          customerPhone: customerPhone || "",
          deliveryType: deliveryType || "Pickup",
          deliveryAddress: deliveryAddress || "",
          bagPrice: bagPrice || 0,
          deliveryFee: deliveryFee || 0,
          totalAmount: totalAmount || 0,
          createdAt: order?.created_at,
        }),
      });
    } catch (e) {
      console.error("WhatsApp notification failed:", e);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
