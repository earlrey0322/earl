import { NextResponse } from "next/server";
import { db } from "@/db";
import { chargingStations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const stations = await db.select().from(chargingStations);
    return NextResponse.json({ stations });
  } catch (error) {
    console.error("Stations GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, latitude, longitude, address, contactNumber, solarWatts, isActive } = body;

    if (!name || !latitude || !longitude || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newStation = await db
      .insert(chargingStations)
      .values({
        name,
        brand: "PSPCS",
        ownerId: auth.userId,
        latitude,
        longitude,
        address,
        contactNumber: contactNumber || null,
        isActive: isActive ?? true,
        solarWatts: solarWatts || 50,
        batteryLevel: 100,
        outputVoltage: "3.6VDC",
        totalSessions: 0,
      })
      .returning();

    return NextResponse.json({ success: true, station: newStation[0] });
  } catch (error) {
    console.error("Stations POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive, latitude, longitude, name, address } = body;

    if (!id) {
      return NextResponse.json({ error: "Station ID required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;

    await db
      .update(chargingStations)
      .set(updateData)
      .where(eq(chargingStations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stations PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
