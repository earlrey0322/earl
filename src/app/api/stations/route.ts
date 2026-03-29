import { NextResponse } from "next/server";
import { getStations, addStation, updateStation, deleteStation, findUserById } from "@/lib/database";
import { getAuthUser } from "@/lib/api-auth";

function transformStation(s: any) {
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
    contactNumber: null,
    isActive: !!s.is_active,
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

export async function GET() {
  const auth = await getAuthUser();
  const stations = getStations();

  let result;
  if (auth && auth.role === "company_owner") {
    result = stations;
  } else {
    result = stations.filter((s: any) => s.company_name === "KLEOXM 111");
  }

  return NextResponse.json({ stations: result.map(transformStation) });
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.name?.trim() || !body.address?.trim() || body.latitude == null || body.longitude == null) {
      return NextResponse.json({ error: "Name, address, latitude, longitude required" }, { status: 400 });
    }

    const user = findUserById(auth.id);
    const station = addStation({
      name: body.name.trim(),
      company_name: auth.role === "company_owner" ? (body.company || "KLEOXM 111") : "KLEOXM 111",
      brand: "PSPCS",
      owner_id: auth.id,
      owner_name: user?.full_name || "Unknown",
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      location: body.location?.trim() || "",
      address: body.address.trim(),
      is_active: body.active !== false,
      solar_watts: 50,
      battery_level: 100,
      total_visits: 0,
      revenue: 0,
      cable_type_c: Number(body.cableTypeC) || 0,
      cable_iphone: Number(body.cableIPhone) || 0,
      cable_universal: Number(body.cableUniversal) || 0,
      outlets: Number(body.outlets) || 1,
    });

    return NextResponse.json({ success: true, station: transformStation(station) });
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

    const stations = getStations();
    const station = stations.find((s: any) => s.id === body.id);
    if (!station) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role !== "company_owner" && station.owner_id !== auth.id) {
      return NextResponse.json({ error: "Not your station" }, { status: 403 });
    }

    const data: any = {};
    if (body.active !== undefined) data.is_active = body.active;
    if (body.name) data.name = body.name;
    if (body.address) data.address = body.address;
    if (body.location !== undefined) data.location = body.location;
    if (body.company && auth.role === "company_owner") data.company_name = body.company;
    if (body.cableTypeC !== undefined) data.cable_type_c = Number(body.cableTypeC);
    if (body.cableIPhone !== undefined) data.cable_iphone = Number(body.cableIPhone);
    if (body.cableUniversal !== undefined) data.cable_universal = Number(body.cableUniversal);
    if (body.outlets !== undefined) data.outlets = Number(body.outlets);

    updateStation(body.id, data);
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

    const stations = getStations();
    const station = stations.find((s: any) => s.id === body.id);
    if (!station) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role !== "company_owner" && station.owner_id !== auth.id) {
      return NextResponse.json({ error: "Can only delete your own" }, { status: 403 });
    }

    deleteStation(body.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE station error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
