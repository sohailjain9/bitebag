import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const {
      orderNumber, restaurantName, restaurantAddress,
      customerName, customerPhone, deliveryType,
      deliveryAddress, bagPrice, deliveryFee, totalAmount, createdAt,
    } = await req.json();

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    // Format date
    const d = new Date(createdAt);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let h = d.getHours();
    const min = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${h}:${min} ${ampm}`;

    const typeCapitalized = deliveryType.charAt(0).toUpperCase() + deliveryType.slice(1);
    const locationLine = deliveryType.toLowerCase() === "delivery"
      ? `Address: ${deliveryAddress}`
      : `Pickup from: ${restaurantAddress}`;

    const messageBody = `🛍️ New BiteBag Order!
Order: ${orderNumber}
Restaurant: ${restaurantName}
Customer: ${customerName}
Phone: ${customerPhone}
Type: ${typeCapitalized}
${locationLine}
Bag Price: ₹${bagPrice}
Delivery Fee: ₹${deliveryFee}
Total: ₹${totalAmount}
Time: ${dateStr}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      From: "whatsapp:+14155238886",
      To: "whatsapp:+919167088949",
      Body: messageBody,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", result);
      throw new Error(result.message || "Failed to send WhatsApp");
    }

    return new Response(
      JSON.stringify({ success: true, sid: result.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
