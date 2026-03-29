import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { users } = getStore();
  const user = users.find((u: any) => u.id === auth.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phoneBrand: user.phoneBrand, contactNumber: user.contactNumber, address: user.address, isSubscribed: user.isSubscribed, subPlan: user.subPlan, subExpiry: user.subExpiry } });
}

export async function PATCH(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { users } = getStore();
  const user = users.find((u: any) => u.id === auth.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.fullName) user.fullName = body.fullName;
  if (body.email) user.email = body.email;
  if (body.contactNumber !== undefined) user.contactNumber = body.contactNumber;
  if (body.address !== undefined) user.address = body.address;
  if (body.phoneBrand !== undefined) user.phoneBrand = body.phoneBrand;
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { users, stations } = getStore();
  const idx = users.findIndex((u: any) => u.id === auth.id);
  if (idx >= 0) users.splice(idx, 1);
  // Remove user's stations
  for (let i = stations.length - 1; i >= 0; i--) {
    if (stations[i].ownerId === auth.id) stations.splice(i, 1);
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set("token", "", { maxAge: 0, path: "/" });
  return res;
}
