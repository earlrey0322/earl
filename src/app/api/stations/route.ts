import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

function toStation(s: any) {
  return {
    id: s.id, name: s.name, companyName: s.company_name, brand: s.brand || "PSPCS",
    ownerId: s.owner_id, ownerName: s.owner_name, latitude: s.latitude, longitude: s.longitude,
    address: s.address, location: s.location || "", contactNumber: null,
    isActive: !!s.is_active, solarWatts: s.solar_watts || 50, batteryLevel: s.battery_level,
    totalVisits: s.total_visits || 0, revenue: s.revenue || 0,
    cableTypeC: s.cable_type_c, cableIPhone: s.cable_iphone, cableUniversal: s.cable_universal, outlets: s.outlets,
  };
}

export async function GET() {
  try {
    const auth = await getAuthUser();
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    let query = supabase.from("charging_stations").select("*").order("id");
    if (!auth || auth.role !== "company_owner") {
      query = query.eq("company_name", "KLEOXM 111");
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ stations: (data || []).map(toStation) });
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

    // Get owner name
    const { data: profile } = await supabase.from("users").select("full_name").eq("id", auth.id).single();

    const { data, error } = await supabase.from("charging_stations").insert({
      name: body.name.trim(),
      company_name: auth.role === "company_owner" ? (body.company || "KLEOXM 111") : "KLEOXM 111",
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
    return NextResponse.json({ success: true, station: toStation(data) });
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
    if (body.company && auth.role === "company_owner") updateData.company_name = body.company;
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
