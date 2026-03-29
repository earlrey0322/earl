import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

// In-memory stations - this persists across requests in the same server process
const STATIONS_KEY = globalThis as unknown as { __stations?: Station[]; __nextId?: number };

interface Station {
  id: number; name: string; companyName: string; brand: string;
  ownerId: number | null; ownerName: string | null;
  latitude: number; longitude: number; address: string;
  contactNumber: string | null; isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
}

function getStations(): Station[] {
  if (!STATIONS_KEY.__stations) {
    STATIONS_KEY.__stations = [
      { id: 1, name: "PSPCS - SM Mall", companyName: "KLEOXM 111", brand: "PSPCS", ownerId: null, ownerName: "KLEOXM 111", latitude: 14.5995, longitude: 120.9842, address: "SM Mall of Asia, Pasay City", contactNumber: "09469086926", isActive: true, solarWatts: 50, batteryLevel: 85, totalVisits: 142, cableTypeC: 2, cableIPhone: 1, cableUniversal: 1, outlets: 2 },
      { id: 2, name: "PSPCS - BGC", companyName: "KLEOXM 111", brand: "PSPCS", ownerId: null, ownerName: "KLEOXM 111", latitude: 14.5537, longitude: 121.0509, address: "BGC High Street, Taguig", contactNumber: "09469086926", isActive: true, solarWatts: 50, batteryLevel: 92, totalVisits: 89, cableTypeC: 1, cableIPhone: 2, cableUniversal: 1, outlets: 1 },
      { id: 3, name: "PSPCS - Quiapo", companyName: "KLEOXM 111", brand: "PSPCS", ownerId: null, ownerName: "KLEOXM 111", latitude: 14.5981, longitude: 120.9837, address: "Quiapo Church, Manila", contactNumber: "09469086926", isActive: false, solarWatts: 50, batteryLevel: 15, totalVisits: 234, cableTypeC: 2, cableIPhone: 1, cableUniversal: 2, outlets: 3 },
      { id: 4, name: "PSPCS - Cubao", companyName: "KLEOXM 111", brand: "PSPCS", ownerId: null, ownerName: "KLEOXM 111", latitude: 14.6188, longitude: 121.0509, address: "Gateway Mall, Cubao, QC", contactNumber: "09469086926", isActive: true, solarWatts: 50, batteryLevel: 78, totalVisits: 67, cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1 },
      { id: 5, name: "PSPCS - Makati", companyName: "KLEOXM 111", brand: "PSPCS", ownerId: null, ownerName: "KLEOXM 111", latitude: 14.5547, longitude: 121.0244, address: "Ayala Center, Makati", contactNumber: "09469086926", isActive: true, solarWatts: 50, batteryLevel: 95, totalVisits: 198, cableTypeC: 2, cableIPhone: 2, cableUniversal: 1, outlets: 2 },
    ];
    STATIONS_KEY.__nextId = 100;
  }
  return STATIONS_KEY.__stations;
}

function getNextId(): number {
  if (!STATIONS_KEY.__nextId) STATIONS_KEY.__nextId = 100;
  return STATIONS_KEY.__nextId!++;
}

export async function GET() {
  try {
    const auth = await getAuthUser();
    const allStations = getStations();

    if (!auth) return NextResponse.json({ stations: allStations.filter(s => s.companyName === "KLEOXM 111") });

    try {
      const user = await db.select().from(users).where(eq(users.id, auth.userId));
      const isSubscribed = user[0]?.isSubscribed;
      if (isSubscribed) return NextResponse.json({ stations: allStations });
    } catch {}

    // Company owner sees all
    if (auth.role === "company_owner") return NextResponse.json({ stations: allStations });

    return NextResponse.json({ stations: allStations.filter(s => s.companyName === "KLEOXM 111") });
  } catch (error) {
    return NextResponse.json({ stations: getStations() });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, latitude, longitude, address, contactNumber, isActive, cableTypeC, cableIPhone, cableUniversal, outlets, companyName } = body;

    if (!name || !name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!address || !address.trim()) return NextResponse.json({ error: "Address is required" }, { status: 400 });
    if (latitude == null || longitude == null) return NextResponse.json({ error: "Location is required" }, { status: 400 });

    let ownerName = "Unknown";
    try {
      const user = await db.select().from(users).where(eq(users.id, auth.userId));
      ownerName = user[0]?.fullName || "Unknown";
    } catch {}

    const newStation: Station = {
      id: getNextId(),
      name: name.trim(),
      companyName: auth.role === "company_owner" ? (companyName || "KLEOXM 111") : "KLEOXM 111",
      brand: "PSPCS",
      ownerId: auth.userId,
      ownerName,
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address.trim(),
      contactNumber: contactNumber || null,
      isActive: isActive !== false,
      solarWatts: 50,
      batteryLevel: 100,
      totalVisits: 0,
      cableTypeC: Number(cableTypeC) || 0,
      cableIPhone: Number(cableIPhone) || 0,
      cableUniversal: Number(cableUniversal) || 0,
      outlets: Number(outlets) || 1,
    };

    getStations().push(newStation);
    return NextResponse.json({ success: true, station: newStation });
  } catch (error) {
    return NextResponse.json({ error: "Failed: " + String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, isActive, name, address, companyName, cableTypeC, cableIPhone, cableUniversal, outlets } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const stations = getStations();
    const idx = stations.findIndex(s => s.id === id);
    if (idx < 0) return NextResponse.json({ error: "Station not found" }, { status: 404 });

    if (isActive !== undefined) stations[idx].isActive = isActive;
    if (name) stations[idx].name = name;
    if (address) stations[idx].address = address;
    if (companyName && auth.role === "company_owner") stations[idx].companyName = companyName;
    if (cableTypeC !== undefined) stations[idx].cableTypeC = Number(cableTypeC);
    if (cableIPhone !== undefined) stations[idx].cableIPhone = Number(cableIPhone);
    if (cableUniversal !== undefined) stations[idx].cableUniversal = Number(cableUniversal);
    if (outlets !== undefined) stations[idx].outlets = Number(outlets);

    return NextResponse.json({ success: true, station: stations[idx] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const stations = getStations();
    const idx = stations.findIndex(s => s.id === body.id);
    if (idx >= 0) stations.splice(idx, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
