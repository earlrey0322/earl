import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        phoneBrand: users.phoneBrand,
        phoneBattery: users.phoneBattery,
        contactNumber: users.contactNumber,
        address: users.address,
        isSubscribed: users.isSubscribed,
        subscriptionExpiry: users.subscriptionExpiry,
        gcashNumber: users.gcashNumber,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, auth.userId));

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: user[0] });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
  return response;
}
