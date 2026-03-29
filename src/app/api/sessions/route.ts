import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  return NextResponse.json({ sessions: [] });
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { stations } = getStore();
    const station = stations.find((s: any) => s.id === body.stationId);
    if (station) station.visits++;
    return NextResponse.json({ success: true, history: { id: Date.now(), ...body, createdAt: new Date().toISOString() } });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

function getStore() { return (globalThis as any)._s ? { stations: (globalThis as any)._s } : { stations: [] }; }
