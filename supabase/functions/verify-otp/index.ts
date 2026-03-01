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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("code", code)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) throw otpError;

    if (!otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Check if user exists
    const email = `${phone}@phone.local`;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === email || u.phone === `+91${phone}`
    );

    let session;

    if (existingUser) {
      // Sign in existing user
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (error) throw error;

      // Use the token to create a session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
        });

      // Actually sign in by verifying the OTP token
      // We'll use signInWithPassword with a generated password approach
      // Better approach: create user with phone, use admin to generate session

      // Generate a session token for the user
      const token = crypto.randomUUID();
      const { data: signInData, error: signInError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: token }
      );
      if (signInError) throw signInError;

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: token,
      });
      if (loginError) throw loginError;

      session = loginData.session;

      // Update display name if provided
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

      // Sign in
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) throw loginError;

      session = loginData.session;

      // Create profile
      await supabase.from("profiles").insert({
        user_id: newUser.user.id,
        phone,
        display_name: displayName || null,
      });
    }

    // Clean up OTP codes for this phone
    await supabase.from("otp_codes").delete().eq("phone", phone);

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
