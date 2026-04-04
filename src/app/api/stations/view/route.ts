import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

const VIEW_POINTS_RATE = 0.1;
const COOLDOWN_HOURS = 24;

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const body = await req.json();
    const { stationId } = body;
    if (!stationId) return NextResponse.json({ error: "stationId required" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up", pointsEarned: 0 });

    const { data: station, error: fetchError } = await supabase
      .from("charging_stations")
      .select("id, owner_id, views, view_revenue, is_active")
      .eq("id", stationId)
      .single();

    if (fetchError || !station) return NextResponse.json({ error: "Station not found" });
    if (!station.is_active) return NextResponse.json({ error: "Station is inactive" });

    const cooldownDate = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();

    const { data: lastView } = await supabase
      .from("station_views")
      .select("viewed_at")
      .eq("user_id", auth.id)
      .eq("station_id", stationId)
      .gte("viewed_at", cooldownDate)
      .order("viewed_at", { ascending: false })
      .limit(1)
      .single();

    if (lastView) {
      return NextResponse.json({
        success: true,
        pointsEarned: 0,
        alreadyViewed: true,
        message: "Already viewed this station today",
      });
    }

    await supabase.from("station_views").insert({
      user_id: auth.id,
      station_id: stationId,
      viewed_at: new Date().toISOString(),
    });

    const newViews = (station.views || 0) + 1;
    const newPoints = (station.view_revenue || 0) + VIEW_POINTS_RATE;

    const { error: updateError } = await supabase
      .from("charging_stations")
      .update({
        views: newViews,
        view_revenue: Math.round(newPoints * 10) / 10,
      })
      .eq("id", stationId);

    if (updateError) {
      console.error("Error updating station view:", updateError);
      return NextResponse.json({ error: updateError.message });
    }

    return NextResponse.json({
      success: true,
      views: newViews,
      points: Math.round(newPoints * 10) / 10,
      pointsEarned: VIEW_POINTS_RATE,
    });
  } catch (e) {
    console.error("POST /api/stations/view error:", e);
    return NextResponse.json({ error: String(e) });
  }
}
