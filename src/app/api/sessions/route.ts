import { NextResponse } from "next/server";
import { db } from "@/db";
import { chargingHistory, chargingStations, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await db.select().from(users).where(eq(users.id, auth.userId));
    const role = user[0]?.role;
    const history = role === "company_owner" || role === "branch_owner"
      ? await db.select().from(chargingHistory).orderBy(desc(chargingHistory.createdAt))
      : await db.select().from(chargingHistory).where(eq(chargingHistory.userId, auth.userId)).orderBy(desc(chargingHistory.createdAt));
    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { stationId, phoneBrand, startBattery, targetBattery, costPesos, durationMinutes } = body;
    if (!stationId || !phoneBrand || startBattery === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const user = await db.select().from(users).where(eq(users.id, auth.userId));
    const station = await db.select().from(chargingStations).where(eq(chargingStations.id, stationId));

    // Increment station visits and revenue
    if (station[0]) {
      await db.update(chargingStations).set({
        totalVisits: (station[0].totalVisits || 0) + 1,
        revenue: (station[0].revenue || 0) + costPesos,
      }).where(eq(chargingStations.id, stationId));
    }

    const newHistory = await db.insert(chargingHistory).values({
      userId: auth.userId,
      userEmail: user[0]?.email || "",
      stationId,
      stationName: station[0]?.name || "Unknown",
      phoneBrand,
      startBattery,
      targetBattery: targetBattery || 100,
      costPesos,
      durationMinutes,
    }).returning();

    return NextResponse.json({ success: true, history: newHistory[0] });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
