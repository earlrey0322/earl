import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ sessions: store.getSessionsByUser(auth.userId) });
  } catch (error) {
    console.error("Sessions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { stationId, phoneBrand, startBattery, targetBattery, costPesos, durationMinutes } = body;
    if (!stationId || !phoneBrand || startBattery === undefined || !costPesos || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = store.addSession({
      userId: auth.userId,
      stationId,
      phoneBrand,
      startBattery,
      targetBattery: targetBattery || 100,
      costPesos,
      durationMinutes,
      status: "active",
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Sessions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
