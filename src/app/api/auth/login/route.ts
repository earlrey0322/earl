import { NextResponse } from "next/server";
import { findUserByEmail, addNotification } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Account not found" });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Wrong password" });
    }

    addNotification({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Login - ${user.full_name}`,
      message: `${user.full_name} (${user.email}) logged in`,
      type: "login",
      is_read: false,
    });

    const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role })).toString("base64");
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, isSubscribed: !!user.is_subscribed },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Server error: " + String(e) });
  }
}
