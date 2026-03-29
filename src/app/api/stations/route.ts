import { NextResponse } from "next/server";
import { getDb } from "@/lib/database";
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
  const db = getDb();

  let stations;
  if (auth && (auth.role === "company_owner")) {
    stations = db.prepare("SELECT * FROM charging_stations ORDER BY id").all();
  } else {
    stations = db.prepare("SELECT * FROM charging_stations WHERE company_name = 'KLEOXM 111' ORDER BY id").all();
  }

  return NextResponse.json({ stations: (stations as any[]).map(transformStation) });
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.name?.trim() || !body.address?.trim() || body.latitude == null || body.longitude == null) {
      return NextResponse.json({ error: "Name, address, latitude, longitude required" }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(auth.id) as any;

    const result = db.prepare(`
      INSERT INTO charging_stations (name, company_name, brand, owner_id, owner_name, latitude, longitude, location, address, is_active, solar_watts, battery_level, total_visits, cable_type_c, cable_iphone, cable_universal, outlets)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.name.trim(),
      auth.role === "company_owner" ? (body.company || "KLEOXM 111") : "KLEOXM 111",
      "PSPCS",
      auth.id,
      user?.full_name || "Unknown",
      Number(body.latitude),
      Number(body.longitude),
      body.location?.trim() || "",
      body.address.trim(),
      body.active !== false ? 1 : 0,
      50, 100, 0,
      Number(body.cableTypeC) || 0,
      Number(body.cableIPhone) || 0,
      Number(body.cableUniversal) || 0,
      Number(body.outlets) || 1,
    );

    const station = db.prepare("SELECT * FROM charging_stations WHERE id = ?").get(result.lastInsertRowid);
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

    const db = getDb();
    const station = db.prepare("SELECT * FROM charging_stations WHERE id = ?").get(body.id) as any;
    if (!station) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role !== "company_owner" && station.owner_id !== auth.id) {
      return NextResponse.json({ error: "Not your station" }, { status: 403 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (body.active !== undefined) { updates.push("is_active = ?"); values.push(body.active ? 1 : 0); }
    if (body.name) { updates.push("name = ?"); values.push(body.name); }
    if (body.address) { updates.push("address = ?"); values.push(body.address); }
    if (body.location !== undefined) { updates.push("location = ?"); values.push(body.location); }
    if (body.company && auth.role === "company_owner") { updates.push("company_name = ?"); values.push(body.company); }
    if (body.cableTypeC !== undefined) { updates.push("cable_type_c = ?"); values.push(Number(body.cableTypeC)); }
    if (body.cableIPhone !== undefined) { updates.push("cable_iphone = ?"); values.push(Number(body.cableIPhone)); }
    if (body.cableUniversal !== undefined) { updates.push("cable_universal = ?"); values.push(Number(body.cableUniversal)); }
    if (body.outlets !== undefined) { updates.push("outlets = ?"); values.push(Number(body.outlets)); }

    if (updates.length > 0) {
      values.push(body.id);
      db.prepare(`UPDATE charging_stations SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    }

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

    const db = getDb();
    const station = db.prepare("SELECT * FROM charging_stations WHERE id = ?").get(body.id) as any;
    if (!station) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role !== "company_owner" && station.owner_id !== auth.id) {
      return NextResponse.json({ error: "Can only delete your own" }, { status: 403 });
    }

    db.prepare("DELETE FROM charging_stations WHERE id = ?").run(body.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE station error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
