import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const { email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = await req.json();
    if (!email || !password || !fullName || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (role === "company_owner" && worklifeAnswer?.toUpperCase() !== "SUSTAINABILITY") return NextResponse.json({ error: "Company owners must answer SUSTAINABILITY" }, { status: 403 });
    if (role === "branch_owner" && worklifeAnswer?.toUpperCase() !== "ENVIRONMENT") return NextResponse.json({ error: "Branch owners must answer ENVIRONMENT" }, { status: 403 });

    const { users, uid } = getStore();
    if (users.find((u: any) => u.email === email.trim())) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const user = { id: uid(), email: email.trim(), password, fullName: fullName.trim(), role, phoneBrand: phoneBrand || null, contactNumber: contactNumber || null, address: address || null, isSubscribed: false, subPlan: null, subExpiry: null };
    users.push(user);

    const token = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }));
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isSubscribed: false } });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
