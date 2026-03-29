import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getAuthUser();
  const { stations } = getStore();
  if (!auth) return NextResponse.json({ stations: stations.filter((s: any) => s.company === "KLEOXM 111") });
  const { users } = getStore();
  const user = users.find((u: any) => u.id === auth.id);
  if (auth.role === "company_owner" || user?.isSubscribed) return NextResponse.json({ stations });
  return NextResponse.json({ stations: stations.filter((s: any) => s.company === "KLEOXM 111") });
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.name?.trim() || !body.address?.trim() || body.latitude == null || body.longitude == null) {
      return NextResponse.json({ error: "Name, address, latitude, longitude required" }, { status: 400 });
    }
    const { users, stations, sid } = getStore();
    const user = users.find((u: any) => u.id === auth.id);
    const station = {
      id: sid(), name: body.name.trim(),
      company: auth.role === "company_owner" ? (body.company || "KLEOXM 111") : "KLEOXM 111",
      ownerId: auth.id, owner: user?.fullName || "Unknown",
      lat: Number(body.latitude), lng: Number(body.longitude),
      addr: body.address.trim(), active: body.active !== false,
      battery: 100, visits: 0,
      tc: Number(body.cableTypeC) || 0, ip: Number(body.cableIPhone) || 0,
      uv: Number(body.cableUniversal) || 0, out: Number(body.outlets) || 1,
    };
    stations.push(station);
    return NextResponse.json({ success: true, station });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const { stations } = getStore();
    const s = stations.find((s: any) => s.id === body.id);
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role !== "company_owner" && s.ownerId !== auth.id) return NextResponse.json({ error: "Not your station" }, { status: 403 });
    if (body.active !== undefined) s.active = body.active;
    if (body.name) s.name = body.name;
    if (body.address) s.addr = body.address;
    if (body.company && auth.role === "company_owner") s.company = body.company;
    if (body.cableTypeC !== undefined) s.tc = Number(body.cableTypeC);
    if (body.cableIPhone !== undefined) s.ip = Number(body.cableIPhone);
    if (body.cableUniversal !== undefined) s.uv = Number(body.cableUniversal);
    if (body.outlets !== undefined) s.out = Number(body.outlets);
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const { stations } = getStore();
    const s = stations.find((s: any) => s.id === body.id);
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role !== "company_owner" && s.ownerId !== auth.id) return NextResponse.json({ error: "Can only delete your own" }, { status: 403 });
    const idx = stations.indexOf(s);
    stations.splice(idx, 1);
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
