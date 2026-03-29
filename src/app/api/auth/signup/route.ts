import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = body;

    if (!email || !password || !fullName || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (role === "company_owner" && worklifeAnswer?.toUpperCase() !== "SUSTAINABILITY") return NextResponse.json({ error: "Company owners must answer SUSTAINABILITY" }, { status: 403 });
    if (role === "branch_owner" && worklifeAnswer?.toUpperCase() !== "ENVIRONMENT") return NextResponse.json({ error: "Branch owners must answer ENVIRONMENT" }, { status: 403 });

    const user = await store.createUser({ email: email.trim(), password, fullName: fullName.trim(), role, phoneBrand, contactNumber, address });

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });
    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isSubscribed: user.isSubscribed } });
    response.cookies.set("auth_token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return response;
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Email already registered") return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    return NextResponse.json({ error: "Server error: " + String(e) }, { status: 500 });
  }
}
