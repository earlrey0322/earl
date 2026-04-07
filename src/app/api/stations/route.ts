import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

const NEARBY_RADIUS_KM = 5;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toStation(s: any, isPremium: boolean, isOwner: boolean) {
  const isKleoXM = !s.company_name || s.company_name === "" || s.company_name === "KLEOXM 111";
  const canSeeLocation = isKleoXM || isPremium || isOwner;
  
  return {
    id: s.id,
    name: s.name,
    companyName: s.company_name || "Pending",
    brand: s.brand || "PSPCS",
    ownerId: s.owner_id,
    ownerName: s.owner_name,
    latitude: canSeeLocation ? s.latitude : 0,
    longitude: canSeeLocation ? s.longitude : 0,
    address: s.address,
    location: canSeeLocation ? (s.location || "") : "",
    isActive: !!s.is_active,
    solarWatts: s.solar_watts || 50,
    batteryLevel: s.battery_level,
    totalVisits: s.total_visits || 0,
    views: s.views || 0,
    viewRevenue: s.view_revenue || 0,
    revenue: s.revenue || 0,
    cableTypeC: s.cable_type_c,
    cableIPhone: s.cable_iphone,
    cableUniversal: s.cable_universal,
    outlets: s.outlets,
    distanceKm: s._distanceKm,
  };
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser();
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const url = new URL(req.url);
    const userLat = parseFloat(url.searchParams.get("lat") || "0");
    const userLon = parseFloat(url.searchParams.get("lon") || "0");
    const hasLocation = userLat !== 0 && userLon !== 0;

    let isPremium = false;
    if (auth) {
      const { data: user } = await supabase.from("users").select("is_subscribed").eq("id", auth.id).single();
      isPremium = !!user?.is_subscribed;
    }

    const { data, error } = await supabase.from("charging_stations").select("*").order("id");
    
    if (error) return NextResponse.json({ error: error.message });

    let stations = (data || []).map((s: any) => {
      const dist = hasLocation ? haversineDistance(userLat, userLon, s.latitude, s.longitude) : 0;
      return { ...s, _distanceKm: dist };
    });

    // Non-premium users only see 2 KLEOXM 111 stations
    if (!isPremium && auth) {
      stations = stations
        .filter((s: any) => s.company_name === "KLEOXM 111" || !s.company_name || s.company_name === "")
        .slice(0, 2);
    }

    return NextResponse.json({
      stations: stations.map((s: any) => toStation(s, isPremium, auth?.id === s.owner_id)),
      isPremium,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const body = await req.json();
    if (!body.name || !body.address || body.latitude == null || body.longitude == null) {
      return NextResponse.json({ error: "Name, address, latitude, longitude required" });
    }

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    if (auth.role === "branch_owner" || auth.role === "other_branch") {
      const { data: userProfile } = await supabase.from("users").select("is_subscribed").eq("id", auth.id).single();
      if (!userProfile?.is_subscribed) {
        return NextResponse.json({ error: "Monthly payment required. Please pay your monthly station fee before adding stations." });
      }
    }

    const { data: profile } = await supabase.from("users").select("full_name").eq("id", auth.id).single();

    let companyName = "";
    if (auth.role === "company_owner") {
      companyName = body.company || "KLEOXM 111";
    }

    const { data, error } = await supabase.from("charging_stations").insert({
      name: body.name.trim(),
      company_name: companyName,
      brand: "PSPCS",
      owner_id: auth.id,
      owner_name: profile?.full_name || "Unknown",
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      location: (body.location || "").trim(),
      address: body.address.trim(),
      is_active: body.active !== false,
      solar_watts: 50,
      battery_level: 100,
      total_visits: 0,
      cable_type_c: Number(body.cableTypeC) || 0,
      cable_iphone: Number(body.cableIPhone) || 0,
      cable_universal: Number(body.cableUniversal) || 0,
      outlets: Number(body.outlets) || 1,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ success: true, station: toStation(data, true, true) });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const updateData: any = {};
    if (body.active !== undefined) updateData.is_active = body.active;
    if (body.name) updateData.name = body.name;
    if (body.address) updateData.address = body.address;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.company !== undefined && auth.role === "company_owner") updateData.company_name = body.company;
    if (body.cableTypeC !== undefined) updateData.cable_type_c = Number(body.cableTypeC);
    if (body.cableIPhone !== undefined) updateData.cable_iphone = Number(body.cableIPhone);
    if (body.cableUniversal !== undefined) updateData.cable_universal = Number(body.cableUniversal);
    if (body.outlets !== undefined) updateData.outlets = Number(body.outlets);

    const { error } = await supabase.from("charging_stations").update(updateData).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const { error } = await supabase.from("charging_stations").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
