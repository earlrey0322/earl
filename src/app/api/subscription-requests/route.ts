import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

// GET - company owner gets all requests, users get their own
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    let query = supabase.from("subscription_requests").select("*").order("created_at", { ascending: false });

    // Non-company owners can only see their own requests
    if (auth.role !== "company_owner") {
      query = query.eq("user_id", auth.id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ requests: data || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

// POST - create a subscription request
export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const body = await req.json();
    const { plan } = body; // "1_day", "1_week", "1_month", "1_year"

    if (!plan || !["1_day", "1_week", "1_month", "1_year"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan. Choose: 1_day, 1_week, 1_month, 1_year" });
    }

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    // Get user info
    const { data: user } = await supabase.from("users").select("full_name, email, role").eq("id", auth.id).single();

    const { error } = await supabase.from("subscription_requests").insert({
      user_id: auth.id,
      user_email: user?.email || auth.email,
      user_name: user?.full_name || "Unknown",
      user_role: user?.role || "customer",
      plan,
      status: "pending",
    });

    if (error) return NextResponse.json({ error: error.message });

    // Notify company owner
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Subscription Request - ${plan}`,
      message: `${user?.full_name} requested ${plan.replace("_", " ")} subscription`,
      type: "subscription_request",
    });

    return NextResponse.json({ success: true, message: "Request sent! Waiting for approval." });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

// PATCH - approve or reject (company owner only)
export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });
    if (auth.role !== "company_owner") return NextResponse.json({ error: "Only company owner can approve" });

    const body = await req.json();
    const { requestId, approve } = body;

    if (!requestId) return NextResponse.json({ error: "requestId required" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    // Get the request
    const { data: request, error: fetchError } = await supabase
      .from("subscription_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) return NextResponse.json({ error: "Request not found" });

    // Update request status
    await supabase
      .from("subscription_requests")
      .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", requestId);

    if (approve) {
      // Calculate expiry
      let daysToAdd = 0;
      if (request.plan === "1_day") daysToAdd = 1;
      else if (request.plan === "1_week") daysToAdd = 7;
      else if (request.plan === "1_month") daysToAdd = 30;
      else if (request.plan === "1_year") daysToAdd = 365;

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + daysToAdd);

      // Update user subscription
      await supabase
        .from("users")
        .update({
          is_subscribed: true,
          subscription_plan: request.plan,
          subscription_expiry: expiry.toISOString(),
        })
        .eq("id", request.user_id);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
