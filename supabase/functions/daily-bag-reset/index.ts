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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all active restaurants and reset their bags
    const { data: restaurants, error: fetchErr } = await supabaseAdmin
      .from("restaurants")
      .select("id, total_bags")
      .eq("active", true);

    if (fetchErr) throw fetchErr;

    let count = 0;
    if (restaurants) {
      for (const r of restaurants) {
        const { error } = await supabaseAdmin
          .from("restaurants")
          .update({ bags_remaining: r.total_bags })
          .eq("id", r.id);
        if (!error) count++;
      }
    }

    console.log(`Daily bag reset: ${count} restaurants reset`);
    return new Response(
      JSON.stringify({ success: true, count }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Daily bag reset error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
