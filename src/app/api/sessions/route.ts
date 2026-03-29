import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Company owner sees all history, others see their own
    const history = auth.role === "company_owner" || auth.role === "branch_owner"
      ? store.getAllHistory()
      : store.getHistoryByUser(auth.userId);
    return NextResponse.json({ history });
  } catch (error) {
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

    const station = store.getStationById(stationId);
    const user = store.findUserById(auth.userId);

    store.incrementStationVisit(stationId);

    const history = store.addChargingHistory({
      userId: auth.userId,
      userEmail: user?.email || "",
      stationId,
      stationName: station?.name || "Unknown",
      phoneBrand,
      startBattery,
      targetBattery: targetBattery || 100,
      costPesos,
      durationMinutes,
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
