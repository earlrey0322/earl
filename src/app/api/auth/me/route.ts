import { NextResponse } from "next/server";
import { findUserById, updateUser, deleteUser, getStations, deleteStation, addNotification } from "@/lib/database";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = findUserById(auth.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      phoneBrand: user.phone_brand,
      contactNumber: user.contact_number,
      address: user.address,
      isSubscribed: !!user.is_subscribed,
      subPlan: user.subscription_plan,
      subExpiry: null,
    },
  });
}

export async function PATCH(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const user = findUserById(auth.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  if (body.fullName) data.full_name = body.fullName;
  if (body.email) data.email = body.email;
  if (body.contactNumber !== undefined) data.contact_number = body.contactNumber;
  if (body.address !== undefined) data.address = body.address;
  if (body.phoneBrand !== undefined) data.phone_brand = body.phoneBrand;

  updateUser(auth.id, data);
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Remove user's stations
  const stations = getStations();
  stations.filter((s: any) => s.owner_id === auth.id).forEach((s: any) => deleteStation(s.id));

  // Remove user
  deleteUser(auth.id);

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", "", { maxAge: 0, path: "/" });
  return res;
}
