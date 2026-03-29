import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

const REDEMPTION_THRESHOLD = 100; // ₱100 minimum to redeem

// GET - company owner gets all redemptions, users get their own
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    let query = supabase.from("redemptions").select("*").order("created_at", { ascending: false });

    // Non-company owners can only see their own redemptions
    if (auth.role !== "company_owner") {
      query = query.eq("user_id", auth.id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ redemptions: data || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

// POST - create a redemption request
export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const body = await req.json();
    const { redemptionType, contactName, contactNumber, deliveryAddress } = body;

    if (!redemptionType || !["free_station", "gcash"].includes(redemptionType)) {
      return NextResponse.json({ error: "Invalid redemption type. Choose: free_station or gcash" });
    }

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    // Get user info and total view revenue from their stations
    const { data: user } = await supabase.from("users").select("full_name, email").eq("id", auth.id).single();

    // Calculate total view revenue from all user's stations
    const { data: stations, error: stationsError } = await supabase
      .from("charging_stations")
      .select("view_revenue")
      .eq("owner_id", auth.id);

    if (stationsError) {
      console.error("Error fetching stations:", stationsError);
      return NextResponse.json({ error: "Error calculating revenue" });
    }

    const totalViewRevenue = (stations || []).reduce((sum, s) => sum + (s.view_revenue || 0), 0);

    if (totalViewRevenue < REDEMPTION_THRESHOLD) {
      return NextResponse.json({ error: `Minimum ₱${REDEMPTION_THRESHOLD} required to redeem. Current: ₱${totalViewRevenue.toFixed(2)}` });
    }

    // For free station redemption, validate required fields
    if (redemptionType === "free_station") {
      if (!contactName || !contactNumber || !deliveryAddress) {
        return NextResponse.json({ error: "Name, contact number, and address required for station delivery" });
      }
    }

    // Round down to nearest whole number (no decimals)
    const redeemAmount = Math.floor(totalViewRevenue);

    const insertData: any = {
      user_id: auth.id,
      user_email: user?.email || auth.email,
      user_name: user?.full_name || "Unknown",
      redemption_type: redemptionType,
      amount: redeemAmount,
      status: "pending",
    };

    if (redemptionType === "free_station") {
      insertData.contact_name = contactName;
      insertData.contact_number = contactNumber;
      insertData.delivery_address = deliveryAddress;
    }

    const { data: redemption, error } = await supabase
      .from("redemptions")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating redemption:", error);
      return NextResponse.json({ error: error.message });
    }

    // Reset view revenue for all user's stations to 0
    const { error: resetError } = await supabase
      .from("charging_stations")
      .update({ views: 0, view_revenue: 0 })
      .eq("owner_id", auth.id);

    if (resetError) {
      console.error("Error resetting view revenue:", resetError);
    }

    // Notify company owner
    const message = redemptionType === "free_station"
      ? `${user?.full_name || "Unknown"} requested FREE STATION redemption (₱${redeemAmount}).\nDeliver to: ${contactName}, ${contactNumber}, ${deliveryAddress}`
      : `${user?.full_name || "Unknown"} requested GCash cashout of ₱${redeemAmount}.\nSend to GCash: 09469086926`;

    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Revenue Redemption - ₱${redeemAmount} (${redemptionType === "free_station" ? "Free Station" : "GCash"})`,
      message,
      type: "redemption_request",
    });

    return NextResponse.json({
      success: true,
      message: "Redemption request submitted! Company owner will process it soon.",
      redemption,
    });
  } catch (e) {
    console.error("POST /api/redemptions error:", e);
    return NextResponse.json({ error: String(e) });
  }
}

// PATCH - approve/reject redemption (company owner only)
export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });
    if (auth.role !== "company_owner") return NextResponse.json({ error: "Only company owner can approve redemptions" });

    const body = await req.json();
    const { redemptionId, approve, status } = body;

    if (!redemptionId) return NextResponse.json({ error: "redemptionId required" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    // Get the redemption
    const { data: redemption, error: fetchError } = await supabase
      .from("redemptions")
      .select("*")
      .eq("id", redemptionId)
      .single();

    if (fetchError || !redemption) return NextResponse.json({ error: "Redemption not found" });

    const newStatus = status || (approve ? "approved" : "rejected");

    // Update redemption status
    await supabase
      .from("redemptions")
      .update({ status: newStatus, reviewed_at: new Date().toISOString() })
      .eq("id", redemptionId);

    // Notify user
    if (approve) {
      const subject = redemption.redemption_type === "free_station"
        ? "Free Station Redemption Approved!"
        : "GCash Cashout Approved!";
      const message = redemption.redemption_type === "free_station"
        ? `Your free charging station redemption (₱${redemption.amount}) has been approved! It will be delivered to ${redemption.contact_name} at ${redemption.delivery_address}.`
        : `Your GCash cashout of ₱${redemption.amount} has been approved! Please check earlrey0322@gmail.com for GCash transfer.`;

      await supabase.from("notifications").insert({
        recipient_email: redemption.user_email,
        subject,
        message,
        type: "redemption_approved",
      });
    } else {
      await supabase.from("notifications").insert({
        recipient_email: redemption.user_email,
        subject: "Redemption Rejected",
        message: `Your ${redemption.redemption_type === "free_station" ? "free station" : "GCash"} redemption request was rejected.`,
        type: "redemption_rejected",
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/redemptions error:", e);
    return NextResponse.json({ error: String(e) });
  }
}
