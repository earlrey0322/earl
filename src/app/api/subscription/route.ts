import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import { SUBSCRIPTION_PLANS } from "@/lib/store";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await db.select().from(users).where(eq(users.id, auth.userId));
    return NextResponse.json({
      isSubscribed: user[0]?.isSubscribed || false,
      plan: user[0]?.subscriptionPlan || null,
      expiry: user[0]?.subscriptionExpiry || null,
      plans: SUBSCRIPTION_PLANS,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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

    await db.update(users).set({
      isSubscribed: true, subscriptionPlan: plan.id,
      subscriptionExpiry: expiry, gcashNumber: "09469086926",
    }).where(eq(users.id, userId));

    await db.insert(notifications).values({
      recipientEmail: "earlrey0322@gmail.com",
      subject: `Subscription - ${plan.label}`,
      message: `User ${userId} subscribed to ${plan.label} (₱${plan.price})`,
      type: "subscription",
    });

    return NextResponse.json({
      success: true,
      gcashDetails: { number: "09469086926", name: "Earl Christian Rey", amount: plan.price },
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "company_owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (!body.targetUserId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
    await db.update(users).set({ isSubscribed: false, subscriptionPlan: null, subscriptionExpiry: null }).where(eq(users.id, body.targetUserId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
