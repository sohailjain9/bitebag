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

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { amount, restaurantId, restaurantName, deliveryType, platformFee, deliveryFee } = await req.json();

    if (!amount || !restaurantId || !restaurantName) {
      throw new Error("Missing required fields");
    }

    const totalPaisa = amount * 100; // Convert INR to paisa

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPaisa,
      currency: "inr",
      metadata: {
        user_id: user.id,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        delivery_type: deliveryType || "Delivery",
      },
    });

    // Insert order into DB using service role
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
        amount: (amount - (platformFee || 10) - (deliveryFee || 0)) * 100,
        platform_fee: (platformFee || 10) * 100,
        delivery_fee: (deliveryFee || 0) * 100,
        total: totalPaisa,
        delivery_type: deliveryType || "Delivery",
        stripe_payment_intent_id: paymentIntent.id,
        status: "Upcoming",
      })
      .select("order_number")
      .single();

    if (orderError) throw orderError;

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        orderNumber: order.order_number,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
