import { NextResponse } from "next/server";
import { getStore, persistData } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const { email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = await req.json();
    if (!email || !password || !fullName || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Worklife verification - no hints about what the answer should be
    if (role === "company_owner" && worklifeAnswer?.toUpperCase() !== "SUSTAINABILITY") {
      return NextResponse.json({ error: "Invalid verification answer" }, { status: 403 });
    }
    if (role === "branch_owner" && worklifeAnswer?.toUpperCase() !== "ENVIRONMENT") {
      return NextResponse.json({ error: "Invalid verification answer" }, { status: 403 });
    }

    const { users, uid } = getStore();
    if (users.find((u: any) => u.email === email.trim())) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const user = { id: uid(), email: email.trim(), password, fullName: fullName.trim(), role, phoneBrand: phoneBrand || null, contactNumber: contactNumber || null, address: address || null, isSubscribed: false, subPlan: null, subExpiry: null };
    users.push(user);
    persistData();

    // Store notification for company owner
    const G = globalThis as any;
    if (!G._notifs) G._notifs = [];
    G._notifs.push({ id: Date.now(), to: "earlrey0322@gmail.com", subject: `New ${role} - ${fullName}`, message: `${fullName} (${email}) signed up as ${role}`, time: new Date().toISOString() });

    const token = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }));
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isSubscribed: false } });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
