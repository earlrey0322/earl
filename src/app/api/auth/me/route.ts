import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = store.findUserById(auth.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phoneBrand: user.phoneBrand, contactNumber: user.contactNumber, address: user.address, isSubscribed: user.isSubscribed, subscriptionPlan: user.subscriptionPlan, subscriptionExpiry: user.subscriptionExpiry, createdAt: user.createdAt },
    });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.fullName) update.fullName = body.fullName;
    if (body.email) update.email = body.email;
    if (body.contactNumber !== undefined) update.contactNumber = body.contactNumber;
    if (body.address !== undefined) update.address = body.address;
    if (body.phoneBrand !== undefined) update.phoneBrand = body.phoneBrand;
    store.updateUser(auth.userId, update);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function DELETE() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    store.deleteUser(auth.userId);
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
    return response;
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST_LOGOUT() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
  return response;
}
