import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = store.findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Account not found. Please sign up first." }, { status: 401 });
    }

    let valid = false;
    try {
      valid = await store.verifyPassword(password, user.password);
    } catch (e) {
      console.error("Password verification error:", e);
      return NextResponse.json({ error: "Password verification failed" }, { status: 500 });
    }

    if (!valid) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    let token: string;
    try {
      token = await createToken({ userId: user.id, email: user.email, role: user.role });
    } catch (e) {
      console.error("Token creation error:", e);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isSubscribed: user.isSubscribed },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error: " + String(error) }, { status: 500 });
  }
}

// GET for testing
export async function GET() {
  return NextResponse.json({ status: "Login API is working", users: store.getAllUsers().length });
}
