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
    if (!auth) {
      console.error("POST /api/subscription-requests: No auth user");
      return NextResponse.json({ error: "Unauthorized" });
    }

    const body = await req.json();
    const { plan, referenceNumber } = body;

    console.log("POST /api/subscription-requests:", { plan, referenceNumber, authId: auth.id });

    if (!plan || !["1_day"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan. Choose: 1_day" });
    }

    if (!referenceNumber || !referenceNumber.trim()) {
      return NextResponse.json({ error: "Reference number required" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      console.error("POST /api/subscription-requests: Supabase not initialized");
      return NextResponse.json({ error: "Database not set up" });
    }

    // Get user info
    const { data: user, error: userError } = await supabase.from("users").select("full_name, email, role").eq("id", auth.id).single();
    
    if (userError) {
      console.error("POST /api/subscription-requests: User fetch error:", userError);
    }

    console.log("POST /api/subscription-requests: User data:", user);

    const insertData = {
      user_id: auth.id,
      user_email: user?.email || auth.email,
      user_name: user?.full_name || "Unknown",
      user_role: user?.role || "customer",
      plan,
      reference_number: referenceNumber.trim(),
      status: "pending",
    };

    console.log("POST /api/subscription-requests: Inserting:", insertData);

    const { data: insertedData, error } = await supabase.from("subscription_requests").insert(insertData).select();

    if (error) {
      console.error("POST /api/subscription-requests: Insert error:", error);
      return NextResponse.json({ error: error.message });
    }

    console.log("POST /api/subscription-requests: Inserted successfully:", insertedData);

    // Notify company owner
    const { error: notifError } = await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Subscription Request - ${plan}`,
      message: `${user?.full_name || "Unknown"} requested ${plan.replace(/_/g, " ")} subscription. Ref: ${referenceNumber}`,
      type: "subscription_request",
    });

    if (notifError) {
      console.error("POST /api/subscription-requests: Notification error:", notifError);
    }

    return NextResponse.json({ success: true, message: "Request sent! Waiting for approval." });
  } catch (e) {
    console.error("POST /api/subscription-requests: Exception:", e);
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
      // Auto-calculate days from plan
      const planDays: Record<string, number> = {
        "1_day": 1
      };
      const daysToAdd = planDays[request.plan] || 1;
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

      // Track revenue in company_revenue table (non-refundable)
      const planPrices: Record<string, number> = {
        "1_day": 25
      };
      const amount = planPrices[request.plan] || 0;
      if (amount > 0) {
        await supabase.from("company_revenue").insert({
          amount,
          source: "subscription",
          source_id: request.id,
          user_email: request.user_email,
          user_name: request.user_name,
          created_at: new Date().toISOString(),
        });
      }

      // Notify user
      await supabase.from("notifications").insert({
        recipient_email: request.user_email,
        subject: "Subscription Approved!",
        message: `Your ${request.plan.replace(/_/g, " ")} subscription has been approved! Expires: ${expiry.toLocaleDateString()}`,
        type: "subscription_approved",
      });
    } else {
      // Notify user of rejection
      await supabase.from("notifications").insert({
        recipient_email: request.user_email,
        subject: "Subscription Rejected",
        message: `Your ${request.plan.replace(/_/g, " ")} subscription request was rejected.`,
        type: "subscription_rejected",
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

// DELETE - remove a subscription request (company owner only)
export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });
    if (auth.role !== "company_owner") return NextResponse.json({ error: "Only company owner can delete" });

    const body = await req.json();
    const { requestId } = body;

    if (!requestId) return NextResponse.json({ error: "requestId required" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const { error } = await supabase
      .from("subscription_requests")
      .delete()
      .eq("id", requestId);

    if (error) return NextResponse.json({ error: error.message });

    return NextResponse.json({ success: true, message: "Request deleted" });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
