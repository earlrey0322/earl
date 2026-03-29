import { NextResponse } from "next/server";
import { db } from "@/db";
import { chargingStations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    const allStations = await db.select().from(chargingStations);
    if (!auth) return NextResponse.json({ stations: allStations.filter((s) => s.companyName === "KLEOXM 111") });
    const user = await db.select().from(users).where(eq(users.id, auth.userId));
    if (!user[0]?.isSubscribed) return NextResponse.json({ stations: allStations.filter((s) => s.companyName === "KLEOXM 111") });
    return NextResponse.json({ stations: allStations });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { name, latitude, longitude, address, contactNumber, isActive, cableTypeC, cableIPhone, cableUniversal, outlets, companyName } = body;
    if (!name || latitude == null || longitude == null || !address) return NextResponse.json({ error: "Missing fields: name, latitude, longitude, address required" }, { status: 400 });

    const user = await db.select().from(users).where(eq(users.id, auth.userId));
    const newStation = await db.insert(chargingStations).values({
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
      cableTypeC: cableTypeC || 0,
      cableIPhone: cableIPhone || 0,
      cableUniversal: cableUniversal || 0,
      outlets: outlets || 1,
    }).returning();
    return NextResponse.json({ success: true, station: newStation[0] });
  } catch (error) {
    console.error("Station POST error:", error);
    return NextResponse.json({ error: "Failed to add station: " + String(error) }, { status: 500 });
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
    await db.update(chargingStations).set(updateData).where(eq(chargingStations.id, id));
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
    await db.delete(chargingStations).where(eq(chargingStations.id, body.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
