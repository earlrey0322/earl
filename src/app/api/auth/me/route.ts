import { NextResponse } from "next/server";
import { findUserById, updateUser, deleteUser, getStations, deleteStation } from "@/lib/database";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const user = findUserById(auth.id);
    if (!user) return NextResponse.json({ error: "User not found" });

    return NextResponse.json({
      user: {
        id: user.id, email: user.email, fullName: user.full_name, role: user.role,
        phoneBrand: user.phone_brand, contactNumber: user.contact_number, address: user.address,
        isSubscribed: !!user.is_subscribed, subPlan: user.subscription_plan, subExpiry: null,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const body = await req.json();
    const data: any = {};
    if (body.fullName) data.full_name = body.fullName;
    if (body.email) data.email = body.email;
    if (body.contactNumber !== undefined) data.contact_number = body.contactNumber;
    if (body.address !== undefined) data.address = body.address;
    if (body.phoneBrand !== undefined) data.phone_brand = body.phoneBrand;

    updateUser(auth.id, data);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

export async function DELETE() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    getStations().filter((s: any) => s.owner_id === auth.id).forEach((s: any) => deleteStation(s.id));
    deleteUser(auth.id);

    const res = NextResponse.json({ success: true });
    res.cookies.set("token", "", { maxAge: 0, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
