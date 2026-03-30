import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

const MONTHLY_FEES: Record<string, number> = {
  "branch_owner": 75,
  "other_branch": 100,
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
    if (!auth) {
      console.error("POST /api/monthly-payments: No auth user");
      return NextResponse.json({ error: "Unauthorized" });
    }

    // Only branch_owner and other_branch can request monthly payments
    if (auth.role !== "branch_owner" && auth.role !== "other_branch") {
      console.error("POST /api/monthly-payments: Invalid role:", auth.role);
      return NextResponse.json({ error: "Only branch owners can request monthly payments" });
    }

    const body = await req.json();
    const { referenceNumber, paidForMonth } = body;

    console.log("POST /api/monthly-payments:", { referenceNumber, paidForMonth, authId: auth.id, role: auth.role });

    if (!referenceNumber || !referenceNumber.trim()) {
      return NextResponse.json({ error: "Reference number required" });
    }

    if (!paidForMonth) {
      return NextResponse.json({ error: "Paid for month required (e.g., 2026-03)" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      console.error("POST /api/monthly-payments: Supabase not initialized");
      return NextResponse.json({ error: "Database not set up" });
    }

    // Get user info
    const { data: user, error: userError } = await supabase.from("users").select("full_name, email, role").eq("id", auth.id).single();
    
    if (userError) {
      console.error("POST /api/monthly-payments: User fetch error:", userError);
    }

    console.log("POST /api/monthly-payments: User data:", user);

    // Get monthly fee based on role
    const amount = MONTHLY_FEES[auth.role] || 75;

    // Check if already has pending request for this month
    const { data: existing, error: existingError } = await supabase
      .from("monthly_payments")
      .select("id")
      .eq("user_id", auth.id)
      .eq("paid_for_month", paidForMonth)
      .eq("status", "pending")
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("POST /api/monthly-payments: Existing check error:", existingError);
    }

    if (existing) {
      return NextResponse.json({ error: "You already have a pending request for this month" });
    }

    const insertData = {
      user_id: auth.id,
      user_email: user?.email || auth.email,
      user_name: user?.full_name || "Unknown",
      user_role: user?.role || auth.role,
      amount,
      reference_number: referenceNumber.trim(),
      status: "pending",
      paid_for_month: paidForMonth,
    };

    console.log("POST /api/monthly-payments: Inserting:", insertData);

    const { data: insertedData, error } = await supabase.from("monthly_payments").insert(insertData).select();

    if (error) {
      console.error("POST /api/monthly-payments: Insert error:", error);
      return NextResponse.json({ error: error.message });
    }

    console.log("POST /api/monthly-payments: Inserted successfully:", insertedData);

    // Notify company owner
    const { error: notifError } = await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Monthly Payment Request - ₱${amount}`,
      message: `${user?.full_name || "Unknown"} (${auth.role}) wants to set premium. Click "Set Premium" to approve. Amount: ₱${amount}, Ref: ${referenceNumber}`,
      type: "monthly_payment",
    });

    if (notifError) {
      console.error("POST /api/monthly-payments: Notification error:", notifError);
    }

    return NextResponse.json({ success: true, message: "Payment request sent! Waiting for approval." });
  } catch (e) {
    console.error("POST /api/monthly-payments: Exception:", e);
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

    const { data: payment, error: fetchError } = await supabase
      .from("monthly_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError || !payment) return NextResponse.json({ error: "Payment not found" });

    await supabase
      .from("monthly_payments")
      .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", paymentId);

    if (approve) {
      // Set user as subscribed for 1 month
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);

      await supabase
        .from("users")
        .update({ is_subscribed: true, subscription_plan: "monthly", subscription_expiry: expiry.toISOString() })
        .eq("id", payment.user_id);

      // Track revenue in company_revenue table (non-refundable)
      await supabase.from("company_revenue").insert({
        amount: payment.amount,
        source: "monthly_payment",
        source_id: payment.id,
        user_email: payment.user_email,
        user_name: payment.user_name,
        created_at: new Date().toISOString(),
      });

      // Notify user
      await supabase.from("notifications").insert({
        recipient_email: payment.user_email,
        subject: "Monthly Payment Approved!",
        message: `Your monthly payment of ₱${payment.amount} has been approved. Premium active until ${expiry.toLocaleDateString()}.`,
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

// DELETE - remove a monthly payment request (company owner only)
export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });
    if (auth.role !== "company_owner") return NextResponse.json({ error: "Only company owner can delete" });

    const body = await req.json();
    const { paymentId } = body;

    if (!paymentId) return NextResponse.json({ error: "paymentId required" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const { error } = await supabase
      .from("monthly_payments")
      .delete()
      .eq("id", paymentId);

    if (error) return NextResponse.json({ error: error.message });

    return NextResponse.json({ success: true, message: "Payment request deleted" });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
