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
      amount, restaurantId, restaurantName, restaurantAddress,
      deliveryType, deliveryFee, deliveryAddress,
      customerName, customerPhone, bagPrice,
    } = await req.json();

    if (!amount || !restaurantId || !restaurantName) {
      throw new Error("Missing required fields");
    }

    const totalPaisa = amount * 100;

    const keyId = Deno.env.get("RAZORPAY_KEY_ID") || "";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

    // Create Razorpay order
    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(keyId + ":" + keySecret),
      },
      body: JSON.stringify({
        amount: totalPaisa,
        currency: "INR",
        receipt: `swoop_${Date.now()}`,
      }),
    });

    const rzpOrder = await rzpResponse.json();
    if (!rzpResponse.ok) {
      throw new Error(rzpOrder.error?.description || "Failed to create Razorpay order");
    }

    // Insert order into database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
        stripe_payment_intent_id: rzpOrder.id, // store razorpay order id here
        status: "pending",
      })
      .select("order_number, id, created_at")
      .single();

    if (orderError) throw orderError;

    return new Response(
      JSON.stringify({
        orderId: rzpOrder.id,
        razorpayKeyId: keyId,
        orderNumber: order.order_number,
        dbOrderId: order.id,
        createdAt: order.created_at,
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
