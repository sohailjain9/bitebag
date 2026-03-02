import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code, displayName } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const serviceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID")!;

    // Verify code via Twilio Verify API
    const twilioUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;
    const verifyBody = new URLSearchParams({
      To: `+91${phone}`,
      Code: code,
    });

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: verifyBody,
    });

    const verifyResult = await twilioRes.json();

    if (!twilioRes.ok || verifyResult.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP verified by Twilio — now handle Supabase auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = `${phone}@phone.local`;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === email || u.phone === `+91${phone}`
    );

    let session;

    if (existingUser) {
      // Sign in existing user
      const token = crypto.randomUUID();
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: token }
      );
      if (updateError) throw updateError;

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: token,
      });
      if (loginError) throw loginError;

      session = loginData.session;

      if (displayName) {
        await supabase
          .from("profiles")
          .update({ display_name: displayName })
          .eq("user_id", existingUser.id);
      }
    } else {
      // Create new user
      const password = crypto.randomUUID();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        phone: `+91${phone}`,
        password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone, display_name: displayName },
      });
      if (createError) throw createError;

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) throw loginError;

      session = loginData.session;

      await supabase.from("profiles").insert({
        user_id: newUser.user.id,
        phone,
        display_name: displayName || null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        session,
        isNewUser: !existingUser,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-otp error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
