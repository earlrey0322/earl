import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

// Redemption tiers based on points
const REDEMPTION_TIERS = {
  free_station: { points: 1000, label: "Free Charging Station (Full Unit)" },
  station_parts: { points: 500, label: "Charging Station All Parts" },
  coin_slots: { points: 100, label: "3 Coin Slots" },
  charging_cable: { points: 50, label: "Charging Cable" },
};

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
    return NextResponse.json({ redemptions: data || [], tiers: REDEMPTION_TIERS });
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

    const validTypes = Object.keys(REDEMPTION_TIERS);
    if (!redemptionType || !validTypes.includes(redemptionType)) {
      return NextResponse.json({ error: `Invalid type. Choose: ${validTypes.join(", ")}` });
    }

    const tier = REDEMPTION_TIERS[redemptionType as keyof typeof REDEMPTION_TIERS];

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    // Get user info and total points from their stations
    const { data: user } = await supabase.from("users").select("full_name, email").eq("id", auth.id).single();

    // Calculate total points from all user's stations
    const { data: stations, error: stationsError } = await supabase
      .from("charging_stations")
      .select("view_revenue")
      .eq("owner_id", auth.id);

    if (stationsError) {
      console.error("Error fetching stations:", stationsError);
      return NextResponse.json({ error: "Error calculating points" });
    }

    const totalPoints = (stations || []).reduce((sum, s) => sum + (s.view_revenue || 0), 0);

    if (totalPoints < tier.points) {
      return NextResponse.json({ error: `Need ${tier.points} points to redeem ${tier.label}. Current: ${totalPoints.toFixed(1)} points` });
    }

    // For station-related redemptions, validate required fields
    if (redemptionType === "free_station" || redemptionType === "station_parts") {
      if (!contactName || !contactNumber || !deliveryAddress) {
        return NextResponse.json({ error: "Name, contact number, and address required for delivery" });
      }
    }

    const insertData: any = {
      user_id: auth.id,
      user_email: user?.email || auth.email,
      user_name: user?.full_name || "Unknown",
      redemption_type: redemptionType,
      redemption_label: tier.label,
      amount: tier.points,
      status: "pending",
    };

    if (redemptionType === "free_station" || redemptionType === "station_parts") {
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

    // Reset points for all user's stations to 0
    const { error: resetError } = await supabase
      .from("charging_stations")
      .update({ views: 0, view_revenue: 0 })
      .eq("owner_id", auth.id);

    if (resetError) {
      console.error("Error resetting points:", resetError);
    }

    // Notify company owner
    let message = `${user?.full_name || "Unknown"} wants to redeem: ${tier.label} (${tier.points} points).\n`;
    if (redemptionType === "free_station" || redemptionType === "station_parts") {
      message += `Deliver to: ${contactName}, ${contactNumber}, ${deliveryAddress}`;
    } else {
      message += `Pick up at office or contact: earlrey0322@gmail.com`;
    }

    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Redemption Request - ${tier.label}`,
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
      const label = redemption.redemption_label || redemption.redemption_type;
      let subject = `Redemption Approved - ${label}`;
      let message = `Your ${label} redemption (${redemption.amount} points) has been approved!`;
      
      if (redemption.redemption_type === "free_station" || redemption.redemption_type === "station_parts") {
        message += ` It will be delivered to ${redemption.contact_name} at ${redemption.delivery_address}.`;
      } else if (redemption.redemption_type === "charging_cable" || redemption.redemption_type === "coin_slots") {
        message += ` Please contact earlrey0322@gmail.com to claim your item.`;
      }

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
        message: `Your redemption request was rejected.`,
        type: "redemption_rejected",
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/redemptions error:", e);
    return NextResponse.json({ error: String(e) });
  }
}
