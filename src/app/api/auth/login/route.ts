import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const user = store.findUserByEmail(email.trim());
    if (!user) return NextResponse.json({ error: "Account not found. Sign up first." }, { status: 401 });

    const valid = await store.verifyPassword(password, user.password);
    if (!valid) return NextResponse.json({ error: "Wrong password" }, { status: 401 });

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });
    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isSubscribed: user.isSubscribed } });
    response.cookies.set("auth_token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Server error: " + String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "OK", users: store.getAllUsers().length });
}
