import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    return NextResponse.json({ stations: store.getAllStations() });
  } catch (error) {
    console.error("Stations GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await (await import("@/lib/api-auth")).getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, latitude, longitude, address, contactNumber, solarWatts, isActive } = body;
    if (!name || !latitude || !longitude || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = store.findUserById(auth.userId);
    const station = store.addStation({
      name,
      brand: "PSPCS",
      ownerId: auth.userId,
      ownerName: user?.fullName || null,
      latitude,
      longitude,
      address,
      contactNumber: contactNumber || null,
      isActive: isActive ?? true,
      solarWatts: solarWatts || 50,
      batteryLevel: 100,
      outputVoltage: "3.6VDC",
      totalSessions: 0,
    });

    return NextResponse.json({ success: true, station });
  } catch (error) {
    console.error("Stations POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await (await import("@/lib/api-auth")).getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, isActive, name, address, latitude, longitude } = body;
    if (!id) return NextResponse.json({ error: "Station ID required" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    store.updateStation(id, updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stations PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
