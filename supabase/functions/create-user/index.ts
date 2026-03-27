import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller is an Executive department user via their JWT + RLS
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: callerProfile, error: profileError } = await callerClient
      .from("users")
      .select("department")
      .single();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not verify caller identity" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (callerProfile.department !== "Executive") {
      return new Response(
        JSON.stringify({ success: false, error: "Only Executive accounts can create users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, password, department, role, team_id } = await req.json();

    if (!name || !email || !password || !department || !role) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: name, email, password, department, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validDepartments = ["Business Development", "Pricing", "Operations", "Accounting", "HR", "Executive"];
    const validRoles = ["staff", "team_leader", "manager"];

    if (!validDepartments.includes(department) || !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid department or role value" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the Supabase Auth user using the service role key
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      const status = authError.message.toLowerCase().includes("already registered") ? 409 : 400;
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newAuthUserId = authData.user.id;

    // The handle_new_auth_user trigger fires and creates a public.users row with email + name from metadata.
    // Now update it with the provided department, role, and team.
    let updateResult = await adminClient
      .from("users")
      .update({ name, department, role, team_id: team_id || null })
      .eq("auth_id", newAuthUserId)
      .select("id, name, email, department, role")
      .maybeSingle();

    // Retry once if trigger hasn't fired yet
    if (!updateResult.data) {
      await new Promise((r) => setTimeout(r, 500));
      updateResult = await adminClient
        .from("users")
        .update({ name, department, role, team_id: team_id || null })
        .eq("auth_id", newAuthUserId)
        .select("id, name, email, department, role")
        .maybeSingle();
    }

    if (updateResult.error) {
      console.error("Profile update error:", updateResult.error);
      // Auth user was created — log for manual recovery but don't fail the whole request
    }

    const updatedUser = updateResult.data;

    return new Response(
      JSON.stringify({ success: true, user: updatedUser }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
