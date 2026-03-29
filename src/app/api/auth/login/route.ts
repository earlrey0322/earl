import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const result = await db.select().from(users).where(eq(users.email, email.trim()));
    if (result.length === 0) return NextResponse.json({ error: "Account not found. Sign up first." }, { status: 401 });

    const user = result[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Wrong password" }, { status: 401 });

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isSubscribed: user.isSubscribed },
    });
    response.cookies.set("auth_token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = await db.select().from(users);
    return NextResponse.json({ status: "OK", users: count.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
