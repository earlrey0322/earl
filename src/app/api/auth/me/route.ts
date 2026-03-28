import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = store.findUserById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phoneBrand: user.phoneBrand,
        phoneBattery: user.phoneBattery,
        contactNumber: user.contactNumber,
        address: user.address,
        isSubscribed: user.isSubscribed,
        subscriptionExpiry: user.subscriptionExpiry,
        gcashNumber: user.gcashNumber,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
  return response;
}
