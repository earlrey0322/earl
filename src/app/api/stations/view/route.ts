import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const VIEW_REVENUE_RATE = 0.20; // ₱0.20 per view

// POST - track station view and add revenue
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stationId } = body;

    if (!stationId) {
      return NextResponse.json({ error: "stationId required" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not set up" });
    }

    // Get current station data
    const { data: station, error: fetchError } = await supabase
      .from("charging_stations")
      .select("id, owner_id, views, view_revenue, is_active")
      .eq("id", stationId)
      .single();

    if (fetchError || !station) {
      return NextResponse.json({ error: "Station not found" });
    }

    if (!station.is_active) {
      return NextResponse.json({ error: "Station is inactive" });
    }

    const newViews = (station.views || 0) + 1;
    const newViewRevenue = (station.view_revenue || 0) + VIEW_REVENUE_RATE;

    // Update station with new view count and revenue
    const { error: updateError } = await supabase
      .from("charging_stations")
      .update({
        views: newViews,
        view_revenue: Math.round(newViewRevenue * 100) / 100, // Round to 2 decimal places
      })
      .eq("id", stationId);

    if (updateError) {
      console.error("Error updating station view:", updateError);
      return NextResponse.json({ error: updateError.message });
    }

    return NextResponse.json({
      success: true,
      views: newViews,
      viewRevenue: Math.round(newViewRevenue * 100) / 100,
    });
  } catch (e) {
    console.error("POST /api/stations/view error:", e);
    return NextResponse.json({ error: String(e) });
  }
}
