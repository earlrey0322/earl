import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getStore, persistData } from "@/lib/data";
import { getAuthUser } from "@/lib/api-auth";

function transformSupabaseStation(s: any) {
  return {
    id: s.id,
    name: s.name,
    companyName: s.company_name,
    brand: s.brand || "PSPCS",
    ownerId: s.owner_id,
    ownerName: s.owner_name,
    latitude: s.latitude,
    longitude: s.longitude,
    address: s.address,
    location: s.location || "",
    contactNumber: s.contact_number || null,
    isActive: s.is_active,
    solarWatts: s.solar_watts || 50,
    batteryLevel: s.battery_level,
    totalVisits: s.total_visits || 0,
    revenue: s.revenue || 0,
    cableTypeC: s.cable_type_c,
    cableIPhone: s.cable_iphone,
    cableUniversal: s.cable_universal,
    outlets: s.outlets,
  };
}

function transformLocalStation(s: any) {
  return {
    id: s.id,
    name: s.name,
    companyName: s.company,
    brand: s.brand || "PSPCS",
    ownerId: s.ownerId,
    ownerName: s.owner,
    latitude: s.lat,
    longitude: s.lng,
    address: s.addr,
    location: s.location || "",
    contactNumber: s.contactNumber || null,
    isActive: s.active,
    solarWatts: s.solarWatts || 50,
    batteryLevel: s.battery,
    totalVisits: s.visits,
    revenue: s.revenue || 0,
    cableTypeC: s.tc,
    cableIPhone: s.ip,
    cableUniversal: s.uv,
    outlets: s.out,
  };
}

export async function GET() {
  const auth = await getAuthUser();

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data: stations, error } = await supabase!
      .from("charging_stations")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Supabase GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let result = stations || [];

    if (!auth || auth.role !== "company_owner") {
      const { data: userProfile } = await supabase!
        .from("users")
        .select("is_subscribed")
        .eq("id", auth?.id || 0)
        .single();

      if (!userProfile?.is_subscribed) {
        result = result.filter((s: any) => s.company_name === "KLEOXM 111");
      }
    }

    return NextResponse.json({ stations: result.map(transformSupabaseStation) });
  }

  const { stations, users } = getStore();
  if (!auth) return NextResponse.json({ stations: stations.filter((s: any) => s.company === "KLEOXM 111").map(transformLocalStation) });
  const user = users.find((u: any) => u.id === auth.id);
  if (auth.role === "company_owner" || user?.isSubscribed) return NextResponse.json({ stations: stations.map(transformLocalStation) });
  return NextResponse.json({ stations: stations.filter((s: any) => s.company === "KLEOXM 111").map(transformLocalStation) });
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.name?.trim() || !body.address?.trim() || body.latitude == null || body.longitude == null) {
      return NextResponse.json({ error: "Name, address, latitude, longitude required" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      const { data: userProfile } = await supabase!
        .from("users")
        .select("full_name")
        .eq("id", auth.id)
        .single();

      const { data: station, error } = await supabase!
        .from("charging_stations")
        .insert({
          name: body.name.trim(),
          company_name: auth.role === "company_owner" ? (body.company || "KLEOXM 111") : "KLEOXM 111",
          brand: "PSPCS",
          owner_id: auth.id,
          owner_name: userProfile?.full_name || "Unknown",
          latitude: Number(body.latitude),
          longitude: Number(body.longitude),
          location: body.location?.trim() || "",
          address: body.address.trim(),
          is_active: body.active !== false,
          solar_watts: 50,
          battery_level: 100,
          total_visits: 0,
          cable_type_c: Number(body.cableTypeC) || 0,
          cable_iphone: Number(body.cableIPhone) || 0,
          cable_universal: Number(body.cableUniversal) || 0,
          outlets: Number(body.outlets) || 1,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, station: transformSupabaseStation(station) });
    }

    const { users, stations, sid } = getStore();
    const user = users.find((u: any) => u.id === auth.id);
    const station = {
      id: sid(), name: body.name.trim(),
      company: auth.role === "company_owner" ? (body.company || "KLEOXM 111") : "KLEOXM 111",
      ownerId: auth.id, owner: user?.fullName || "Unknown",
      lat: Number(body.latitude), lng: Number(body.longitude),
      location: body.location?.trim() || "",
      addr: body.address.trim(), active: body.active !== false,
      battery: 100, visits: 0,
      tc: Number(body.cableTypeC) || 0, ip: Number(body.cableIPhone) || 0,
      uv: Number(body.cableUniversal) || 0, out: Number(body.outlets) || 1,
    };
    stations.push(station);
    persistData();
    return NextResponse.json({ success: true, station: transformLocalStation(station) });
  } catch (e) {
    console.error("POST station error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      const updateData: any = {};
      if (body.active !== undefined) updateData.is_active = body.active;
      if (body.name) updateData.name = body.name;
      if (body.address) updateData.address = body.address;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.company && auth.role === "company_owner") updateData.company_name = body.company;
      if (body.cableTypeC !== undefined) updateData.cable_type_c = Number(body.cableTypeC);
      if (body.cableIPhone !== undefined) updateData.cable_iphone = Number(body.cableIPhone);
      if (body.cableUniversal !== undefined) updateData.cable_universal = Number(body.cableUniversal);
      if (body.outlets !== undefined) updateData.outlets = Number(body.outlets);

      const { error } = await supabase!
        .from("charging_stations")
        .update(updateData)
        .eq("id", body.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const { stations } = getStore();
    const s = stations.find((s: any) => s.id === body.id);
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role !== "company_owner" && s.ownerId !== auth.id) return NextResponse.json({ error: "Not your station" }, { status: 403 });
    if (body.active !== undefined) s.active = body.active;
    if (body.name) s.name = body.name;
    if (body.address) s.addr = body.address;
    if (body.location !== undefined) s.location = body.location;
    if (body.company && auth.role === "company_owner") s.company = body.company;
    if (body.cableTypeC !== undefined) s.tc = Number(body.cableTypeC);
    if (body.cableIPhone !== undefined) s.ip = Number(body.cableIPhone);
    if (body.cableUniversal !== undefined) s.uv = Number(body.cableUniversal);
    if (body.outlets !== undefined) s.out = Number(body.outlets);
    persistData();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH station error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      const { error } = await supabase!
        .from("charging_stations")
        .delete()
        .eq("id", body.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const { stations } = getStore();
    const s = stations.find((s: any) => s.id === body.id);
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role !== "company_owner" && s.ownerId !== auth.id) return NextResponse.json({ error: "Can only delete your own" }, { status: 403 });
    const idx = stations.indexOf(s);
    stations.splice(idx, 1);
    persistData();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE station error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
