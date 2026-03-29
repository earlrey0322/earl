import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = store.findUserByEmail(email.trim());
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 401 });
    }

    let valid = false;
    try {
      valid = await store.verifyPassword(password, user.password);
    } catch (e) {
      return NextResponse.json({ error: "Password check failed: " + String(e) }, { status: 500 });
    }

    if (!valid) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    let token: string;
    try {
      token = await createToken({ userId: user.id, email: user.email, role: user.role });
    } catch (e) {
      return NextResponse.json({ error: "Token failed: " + String(e) }, { status: 500 });
    }

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isSubscribed: user.isSubscribed },
    });
    res.cookies.set("auth_token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Login crash: " + String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, count: store.getAllUsers().length });
}
