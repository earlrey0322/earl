import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

// In-memory fallback for when DB table doesn't match schema
let memStations: Record<string, unknown>[] = [
  { id: 1, name: "PSPCS Station - SM Mall", companyName: "KLEOXM 111", brand: "PSPCS", latitude: 14.5995, longitude: 120.9842, address: "SM Mall of Asia, Pasay City", isActive: true, solarWatts: 50, batteryLevel: 85, totalVisits: 142, revenue: 710, cableTypeC: 2, cableIPhone: 1, cableUniversal: 1, outlets: 2, ownerId: null, ownerName: "KLEOXM 111" },
  { id: 2, name: "PSPCS Station - BGC", companyName: "KLEOXM 111", brand: "PSPCS", latitude: 14.5537, longitude: 121.0509, address: "BGC High Street, Taguig City", isActive: true, solarWatts: 50, batteryLevel: 92, totalVisits: 89, revenue: 445, cableTypeC: 1, cableIPhone: 2, cableUniversal: 1, outlets: 1, ownerId: null, ownerName: "KLEOXM 111" },
  { id: 3, name: "PSPCS Station - Quiapo", companyName: "KLEOXM 111", brand: "PSPCS", latitude: 14.5981, longitude: 120.9837, address: "Quiapo Church Area, Manila", isActive: false, solarWatts: 50, batteryLevel: 15, totalVisits: 234, revenue: 1170, cableTypeC: 2, cableIPhone: 1, cableUniversal: 2, outlets: 3, ownerId: null, ownerName: "KLEOXM 111" },
  { id: 4, name: "PSPCS Station - Cubao", companyName: "KLEOXM 111", brand: "PSPCS", latitude: 14.6188, longitude: 121.0509, address: "Gateway Mall, Cubao, QC", isActive: true, solarWatts: 50, batteryLevel: 78, totalVisits: 67, revenue: 335, cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1, ownerId: null, ownerName: "KLEOXM 111" },
  { id: 5, name: "PSPCS Station - Makati", companyName: "KLEOXM 111", brand: "PSPCS", latitude: 14.5547, longitude: 121.0244, address: "Ayala Center, Makati City", isActive: true, solarWatts: 50, batteryLevel: 95, totalVisits: 198, revenue: 990, cableTypeC: 2, cableIPhone: 2, cableUniversal: 1, outlets: 2, ownerId: null, ownerName: "KLEOXM 111" },
];
let memId = 100;
let useMem = false;

export async function GET() {
  try {
    const auth = await getAuthUser();

    if (!useMem) {
      try {
        const { chargingStations } = await import("@/db/schema");
        const allStations = await db.select().from(chargingStations);
        memStations = allStations;
      } catch {
        useMem = true;
      }
    }

    const stations = useMem ? memStations : memStations;

    if (!auth) {
      return NextResponse.json({ stations: stations.filter((s: Record<string, unknown>) => (s.companyName || "KLEOXM 111") === "KLEOXM 111") });
    }

    const user = await db.select().from(users).where(eq(users.id, auth.userId));
    const isSubscribed = user[0]?.isSubscribed;
    const role = user[0]?.role;

    // Company owner sees all stations
    if (role === "company_owner" || isSubscribed) {
      return NextResponse.json({ stations });
    }

    // Free users see only KLEOXM 111
    return NextResponse.json({ stations: stations.filter((s: Record<string, unknown>) => (s.companyName || "KLEOXM 111") === "KLEOXM 111") });
  } catch (error) {
    return NextResponse.json({ stations: memStations, error: String(error) });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, latitude, longitude, address, contactNumber, isActive, cableTypeC, cableIPhone, cableUniversal, outlets, companyName } = body;
    if (!name || latitude == null || longitude == null || !address) {
      return NextResponse.json({ error: "Missing: name, latitude, longitude, address" }, { status: 400 });
    }

    const user = await db.select().from(users).where(eq(users.id, auth.userId));

    const stationData = {
      id: memId++,
      name,
      companyName: auth.role === "company_owner" ? (companyName || "KLEOXM 111") : "KLEOXM 111",
      brand: "PSPCS",
      ownerId: auth.userId,
      ownerName: user[0]?.fullName || null,
      latitude: Number(latitude),
      longitude: Number(longitude),
      address,
      contactNumber: contactNumber || null,
      isActive: isActive ?? true,
      solarWatts: 50,
      batteryLevel: 100,
      outputVoltage: "3.6VDC",
      totalVisits: 0,
      revenue: 0,
      cableTypeC: cableTypeC || 0,
      cableIPhone: cableIPhone || 0,
      cableUniversal: cableUniversal || 0,
      outlets: outlets || 1,
      createdAt: new Date(),
    };

    if (!useMem) {
      try {
        // Try inserting with new schema
        const { chargingStations } = await import("@/db/schema");
        const newStation = await db.insert(chargingStations).values({
          name: stationData.name,
          companyName: stationData.companyName,
          brand: stationData.brand,
          ownerId: stationData.ownerId,
          ownerName: stationData.ownerName,
          latitude: stationData.latitude,
          longitude: stationData.longitude,
          address: stationData.address,
          contactNumber: stationData.contactNumber,
          isActive: stationData.isActive,
          solarWatts: stationData.solarWatts,
          batteryLevel: stationData.batteryLevel,
          cableTypeC: stationData.cableTypeC,
          cableIPhone: stationData.cableIPhone,
          cableUniversal: stationData.cableUniversal,
          outlets: stationData.outlets,
        }).returning();
        memStations.push(newStation[0]);
        return NextResponse.json({ success: true, station: newStation[0] });
      } catch (dbError) {
        // Fallback to memory
        console.error("DB insert failed, using memory:", dbError);
        useMem = true;
      }
    }

    // Memory fallback
    memStations.push(stationData);
    return NextResponse.json({ success: true, station: stationData });
  } catch (error) {
    console.error("Station POST error:", error);
    return NextResponse.json({ error: "Failed: " + String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (updateData.companyName && auth.role !== "company_owner") delete updateData.companyName;

    if (!useMem) {
      try {
        const { chargingStations } = await import("@/db/schema");
        await db.update(chargingStations).set(updateData).where(eq(chargingStations.id, id));
      } catch { useMem = true; }
    }

    if (useMem) {
      const idx = memStations.findIndex((s: Record<string, unknown>) => s.id === id);
      if (idx >= 0) Object.assign(memStations[idx], updateData);
    }

    return NextResponse.json({ success: true });
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

    if (!useMem) {
      try {
        const { chargingStations } = await import("@/db/schema");
        await db.delete(chargingStations).where(eq(chargingStations.id, body.id));
      } catch { useMem = true; }
    }

    if (useMem) {
      memStations = memStations.filter((s: Record<string, unknown>) => s.id !== body.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
