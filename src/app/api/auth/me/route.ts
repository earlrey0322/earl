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
      user: {
        id: user.id, email: user.email, fullName: user.fullName, role: user.role,
        phoneBrand: user.phoneBrand, phoneBattery: user.phoneBattery,
        contactNumber: user.contactNumber, address: user.address,
        isSubscribed: user.isSubscribed, subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiry: user.subscriptionExpiry, gcashNumber: user.gcashNumber,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { fullName, email, password, contactNumber, address, phoneBrand } = body;

    const updateData: Record<string, unknown> = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (address !== undefined) updateData.address = address;
    if (phoneBrand !== undefined) updateData.phoneBrand = phoneBrand;

    if (password) {
      const bcrypt = await import("bcryptjs");
      updateData.password = await bcrypt.hash(password, 10);
    }

    store.updateUser(auth.userId, updateData);
    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    store.deleteUser(auth.userId);
    const response = NextResponse.json({ success: true, message: "Account deleted" });
    response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
  return response;
}
