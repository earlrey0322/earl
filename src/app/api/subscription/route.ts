import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function POST() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    store.updateUser(auth.userId, { isSubscribed: true, subscriptionExpiry: expiry, gcashNumber: "09469086926" });

    store.addNotification({
      recipientEmail: "earlrey0322@gmail.com",
      subject: "New Subscription",
      message: `User ID ${auth.userId} subscribed. GCash: 09469086926`,
      type: "subscription",
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription activated!",
      gcashDetails: { number: "09469086926", name: "Earl Christian Rey", amount: 50 },
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = store.findUserById(auth.userId);
    return NextResponse.json({ isSubscribed: user?.isSubscribed || false });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
