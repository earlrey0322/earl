import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    const stations = store.getAllStations();
    if (!auth) {
      return NextResponse.json({ stations: stations.filter((s) => s.companyName === "KLEOXM 111") });
    }
    const user = store.findUserById(auth.userId);
    if (!user?.isSubscribed) {
      return NextResponse.json({ stations: stations.filter((s) => s.companyName === "KLEOXM 111") });
    }
    return NextResponse.json({ stations });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, latitude, longitude, address, contactNumber, solarWatts, isActive, cableTypeC, cableIPhone, cableUniversal, outlets, companyName } = body;
    if (!name || !latitude || !longitude || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = store.findUserById(auth.userId);
    const station = store.addStation({
      name,
      companyName: auth.role === "company_owner" ? (companyName || "KLEOXM 111") : "KLEOXM 111",
      brand: "PSPCS",
      ownerId: auth.userId,
      ownerName: user?.fullName || null,
      latitude, longitude, address,
      contactNumber: contactNumber || null,
      isActive: isActive ?? true,
      solarWatts: solarWatts || 50,
      batteryLevel: 100,
      outputVoltage: "3.6VDC",
      totalVisits: 0,
      cableTypeC: cableTypeC || 0,
      cableIPhone: cableIPhone || 0,
      cableUniversal: cableUniversal || 0,
      outlets: outlets || 1,
    });

    return NextResponse.json({ success: true, station });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "Station ID required" }, { status: 400 });

    if (updateData.companyName && auth.role !== "company_owner") {
      delete updateData.companyName;
    }

    store.updateStation(id, updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
