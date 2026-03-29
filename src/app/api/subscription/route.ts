import { NextResponse } from "next/server";
import { store, SUBSCRIPTION_PLANS } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { planId, targetUserId } = body;
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const userId = (auth.role === "company_owner" && targetUserId) ? targetUserId : auth.userId;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + plan.days);

    store.updateUser(userId, {
      isSubscribed: true, subscriptionPlan: plan.id,
      subscriptionExpiry: expiry, gcashNumber: "09469086926",
    });

    store.addNotification({
      recipientEmail: "earlrey0322@gmail.com",
      subject: `New Subscription - ${plan.label}`,
      message: `User ID ${userId} subscribed to ${plan.label} (₱${plan.price}). GCash: 09469086926`,
      type: "subscription", isRead: false,
    });

    // Track company owner subscription revenue
    store.addSubscriptionRevenue(plan.price);

    return NextResponse.json({
      success: true, message: `${plan.label} subscription activated!`,
      gcashDetails: { number: "09469086926", name: "Earl Christian Rey", amount: plan.price },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "company_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { targetUserId } = body;
    if (!targetUserId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
    store.updateUser(targetUserId, { isSubscribed: false, subscriptionPlan: null, subscriptionExpiry: null });
    return NextResponse.json({ success: true, message: "Subscription removed" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = store.findUserById(auth.userId);
    return NextResponse.json({
      isSubscribed: user?.isSubscribed || false,
      plan: user?.subscriptionPlan || null,
      expiry: user?.subscriptionExpiry || null,
      plans: SUBSCRIPTION_PLANS,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
