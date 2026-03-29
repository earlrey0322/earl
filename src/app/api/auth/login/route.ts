import { NextResponse } from "next/server";
import { findUserByEmail, addNotification } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = findUserByEmail(email.trim());
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 401 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    addNotification({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Login - ${user.full_name}`,
      message: `${user.full_name} (${user.email}) logged in as ${user.role}`,
      type: "login",
      is_read: false,
    });

    const token = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }));
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isSubscribed: !!user.is_subscribed,
      },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
