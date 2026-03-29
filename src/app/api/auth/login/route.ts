import { NextResponse } from "next/server";
import { getDb } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const db = getDb();

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim()) as any;
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 401 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    // Create notification
    db.prepare(`
      INSERT INTO notifications (recipient_email, subject, message, type)
      VALUES (?, ?, ?, ?)
    `).run("earlrey0322@gmail.com", `Login - ${user.full_name}`, `${user.full_name} (${user.email}) logged in as ${user.role}`, "login");

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
