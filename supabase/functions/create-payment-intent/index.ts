import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
      amount, restaurantId, restaurantName, restaurantAddress,
      deliveryType, deliveryFee, deliveryAddress,
      customerName, customerPhone, bagPrice,
    } = await req.json();

    if (!amount || !restaurantId || !restaurantName) {
      throw new Error("Missing required fields");
    }

    const totalPaisa = amount * 100;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPaisa,
      currency: "inr",
      metadata: {
        user_id: user.id,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        delivery_type: deliveryType || "Pickup",
      },
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        restaurant_address: restaurantAddress || "",
        amount: (bagPrice || 0) * 100,
        platform_fee: 0,
        delivery_fee: (deliveryFee || 0) * 100,
        total: totalPaisa,
        delivery_type: deliveryType || "Pickup",
        delivery_address: deliveryAddress || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        stripe_payment_intent_id: paymentIntent.id,
        status: "confirmed",
      })
      .select("order_number, id, created_at")
      .single();

    if (orderError) throw orderError;

    // Atomically decrement bags_remaining
    await supabaseAdmin.rpc("decrement_bags", { restaurant_uuid: restaurantId });

    // Send WhatsApp notification (fire and forget)
    try {
      const notifUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp-notification`;
      console.log("Calling WhatsApp notification at:", notifUrl);
      const notifResponse = await fetch(notifUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          orderNumber: order.order_number,
          restaurantName,
          restaurantAddress: restaurantAddress || "",
          customerName: customerName || "Guest",
          customerPhone: customerPhone || "",
          deliveryType: deliveryType || "Pickup",
          deliveryAddress: deliveryAddress || "",
          bagPrice: bagPrice || 0,
          deliveryFee: deliveryFee || 0,
          totalAmount: amount,
          createdAt: order.created_at,
        }),
      });
      const notifResult = await notifResponse.text();
      console.log("WhatsApp notification response:", notifResponse.status, notifResult);
    } catch (e) {
      console.error("WhatsApp notification failed:", e);
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        orderNumber: order.order_number,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
