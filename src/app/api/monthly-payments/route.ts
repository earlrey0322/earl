import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

const MONTHLY_FEES: Record<string, number> = {
  "branch_owner": 200,
  "other_branch": 250,
};

// GET - company owner gets all requests, users get their own
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    let query = supabase.from("monthly_payments").select("*").order("created_at", { ascending: false });

    // Non-company owners can only see their own requests
    if (auth.role !== "company_owner") {
      query = query.eq("user_id", auth.id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ payments: data || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

// POST - create a monthly payment request
export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    // Only branch_owner and other_branch can request monthly payments
    if (auth.role !== "branch_owner" && auth.role !== "other_branch") {
      return NextResponse.json({ error: "Only branch owners can request monthly payments" });
    }

    const body = await req.json();
    const { referenceNumber, paidForMonth } = body;

    if (!referenceNumber || !referenceNumber.trim()) {
      return NextResponse.json({ error: "Reference number required" });
    }

    if (!paidForMonth) {
      return NextResponse.json({ error: "Paid for month required (e.g., 2026-03)" });
    }

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    // Get user info
    const { data: user } = await supabase.from("users").select("full_name, email, role").eq("id", auth.id).single();

    // Get monthly fee based on role
    const amount = MONTHLY_FEES[auth.role] || 200;

    // Check if already has pending request for this month
    const { data: existing } = await supabase
      .from("monthly_payments")
      .select("id")
      .eq("user_id", auth.id)
      .eq("paid_for_month", paidForMonth)
      .eq("status", "pending")
      .single();

    if (existing) {
      return NextResponse.json({ error: "You already have a pending request for this month" });
    }

    const { error } = await supabase.from("monthly_payments").insert({
      user_id: auth.id,
      user_email: user?.email || auth.email,
      user_name: user?.full_name || "Unknown",
      user_role: user?.role || auth.role,
      amount,
      reference_number: referenceNumber.trim(),
      status: "pending",
      paid_for_month: paidForMonth,
    });

    if (error) return NextResponse.json({ error: error.message });

    // Notify company owner
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Monthly Payment Request - ₱${amount}`,
      message: `${user?.full_name} (${auth.role}) submitted monthly payment of ₱${amount} for ${paidForMonth}. Ref: ${referenceNumber}`,
      type: "monthly_payment",
    });

    return NextResponse.json({ success: true, message: "Payment request sent! Waiting for approval." });
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
    const { paymentId, approve } = body;

    if (!paymentId) return NextResponse.json({ error: "paymentId required" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    // Get the payment
    const { data: payment, error: fetchError } = await supabase
      .from("monthly_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError || !payment) return NextResponse.json({ error: "Payment not found" });

    // Update payment status
    await supabase
      .from("monthly_payments")
      .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", paymentId);

    if (approve) {
      // Calculate expiry - 1 month from now
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);

      // Update user subscription
      await supabase
        .from("users")
        .update({
          is_subscribed: true,
          subscription_plan: "monthly",
          subscription_expiry: expiry.toISOString(),
        })
        .eq("id", payment.user_id);

      // Notify user
      await supabase.from("notifications").insert({
        recipient_email: payment.user_email,
        subject: "Monthly Payment Approved!",
        message: `Your monthly payment of ₱${payment.amount} has been approved. Your subscription is active until ${expiry.toLocaleDateString()}.`,
        type: "payment_approved",
      });
    } else {
      // Notify user of rejection
      await supabase.from("notifications").insert({
        recipient_email: payment.user_email,
        subject: "Monthly Payment Rejected",
        message: `Your monthly payment of ₱${payment.amount} was rejected. Please submit a new payment.`,
        type: "payment_rejected",
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
