import { NextResponse } from "next/server";
import { db } from "@/db";
import { chargingSessions, chargingStations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db
      .select()
      .from(chargingSessions)
      .where(eq(chargingSessions.userId, auth.userId));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Sessions GET error:", error);
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
    const { stationId, phoneBrand, startBattery, targetBattery, costPesos, durationMinutes } = body;

    if (!stationId || !phoneBrand || startBattery === undefined || !costPesos || !durationMinutes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newSession = await db
      .insert(chargingSessions)
      .values({
        userId: auth.userId,
        stationId,
        phoneBrand,
        startBattery,
        targetBattery: targetBattery || 100,
        costPesos,
        durationMinutes,
        status: "active",
      })
      .returning();

    // Update station session count
    const station = await db
      .select()
      .from(chargingStations)
      .where(eq(chargingStations.id, stationId));

    if (station.length > 0) {
      await db
        .update(chargingStations)
        .set({ totalSessions: (station[0].totalSessions || 0) + 1 })
        .where(eq(chargingStations.id, stationId));
    }

    return NextResponse.json({ success: true, session: newSession[0] });
  } catch (error) {
    console.error("Sessions POST error:", error);
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Session ID and status required" }, { status: 400 });
    }

    await db
      .update(chargingSessions)
      .set({ status })
      .where(eq(chargingSessions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sessions PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
