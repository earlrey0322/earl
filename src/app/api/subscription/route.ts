import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gcashNumber } = body;

    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);

    await db
      .update(users)
      .set({
        isSubscribed: true,
        subscriptionExpiry: expiry,
        gcashNumber: gcashNumber || "09469086926",
      })
      .where(eq(users.id, auth.userId));

    // Notify company owner about subscription
    await db.insert(notifications).values({
      recipientEmail: "earlrey0322@gmail.com",
      subject: "New Subscription",
      message: `User ${auth.email} has subscribed to Premium. GCash payment to 09469086926 (Earl Christian Rey). Amount: ₱50/month.`,
      type: "subscription",
    });

    return NextResponse.json({
      success: true,
      message: "Subscription activated! Payment via GCash: 09469086926 (Earl Christian Rey)",
      gcashDetails: {
        number: "09469086926",
        name: "Earl Christian Rey",
        amount: 50,
      },
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select({
        isSubscribed: users.isSubscribed,
        subscriptionExpiry: users.subscriptionExpiry,
      })
      .from(users)
      .where(eq(users.id, auth.userId));

    return NextResponse.json({
      isSubscribed: user[0]?.isSubscribed || false,
      subscriptionExpiry: user[0]?.subscriptionExpiry || null,
    });
  } catch (error) {
    console.error("Subscription GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
