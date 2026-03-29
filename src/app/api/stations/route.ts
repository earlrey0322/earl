import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    const all = store.getAllStations();
    if (!auth) return NextResponse.json({ stations: all.filter(s => s.companyName === "KLEOXM 111") });
    const user = store.findUserById(auth.userId);
    if (auth.role === "company_owner" || user?.isSubscribed) return NextResponse.json({ stations: all });
    return NextResponse.json({ stations: all.filter(s => s.companyName === "KLEOXM 111") });
  } catch { return NextResponse.json({ stations: [] }); }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, latitude, longitude, address, contactNumber, isActive, cableTypeC, cableIPhone, cableUniversal, outlets, companyName } = body;
    if (!name?.trim() || !address?.trim() || latitude == null || longitude == null) {
      return NextResponse.json({ error: "Name, address, latitude, longitude required" }, { status: 400 });
    }

    const user = store.findUserById(auth.userId);

    // Branch owner: can only create stations under KLEOXM 111
    // Company owner: can set any company name
    const stationCompany = auth.role === "company_owner" ? (companyName || "KLEOXM 111") : "KLEOXM 111";

    const station = store.addStation({
      name: name.trim(), companyName: stationCompany,
      ownerId: auth.userId, ownerName: user?.fullName || "Unknown",
      latitude: Number(latitude), longitude: Number(longitude),
      address: address.trim(), contactNumber: contactNumber || null,
      isActive: isActive !== false, solarWatts: 50, batteryLevel: 100,
      totalVisits: 0, cableTypeC: Number(cableTypeC) || 0, cableIPhone: Number(cableIPhone) || 0,
      cableUniversal: Number(cableUniversal) || 0, outlets: Number(outlets) || 1,
    });

    return NextResponse.json({ success: true, station });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const station = store.getAllStations().find(s => s.id === id);
    if (!station) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only owner or company_owner can edit
    if (auth.role !== "company_owner" && station.ownerId !== auth.userId) {
      return NextResponse.json({ error: "Not your station" }, { status: 403 });
    }

    // Only company_owner can change companyName
    if (data.companyName && auth.role !== "company_owner") delete data.companyName;

    store.updateStation(id, data);
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const station = store.getAllStations().find(s => s.id === body.id);
    if (!station) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Company owner can delete any, branch owner only their own
    if (auth.role !== "company_owner" && station.ownerId !== auth.userId) {
      return NextResponse.json({ error: "Can only delete your own station" }, { status: 403 });
    }

    store.deleteStation(body.id);
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 500 }); }
}
