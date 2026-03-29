import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const { users } = getStore();
    const user = users.find((u: any) => u.email === email.trim());
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 401 });
    if (user.password !== password) return NextResponse.json({ error: "Wrong password" }, { status: 401 });

    // Log notification
    const G = globalThis as any;
    if (!G._notifs) G._notifs = [];
    G._notifs.push({ id: Date.now(), to: "earlrey0322@gmail.com", subject: `Login - ${user.fullName}`, message: `${user.fullName} (${user.email}) logged in as ${user.role}`, time: new Date().toISOString() });

    const token = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }));
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isSubscribed: user.isSubscribed } });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
