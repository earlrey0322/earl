import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const result = await db.select().from(users).where(eq(users.id, auth.userId));
    if (result.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const u = result[0];
    return NextResponse.json({
      user: {
        id: u.id, email: u.email, fullName: u.fullName, role: u.role,
        phoneBrand: u.phoneBrand, contactNumber: u.contactNumber, address: u.address,
        isSubscribed: u.isSubscribed, subscriptionPlan: u.subscriptionPlan,
        subscriptionExpiry: u.subscriptionExpiry, createdAt: u.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
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
    if (body.password) update.password = await bcrypt.hash(body.password, 10);
    await db.update(users).set(update).where(eq(users.id, auth.userId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await db.delete(users).where(eq(users.id, auth.userId));
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
