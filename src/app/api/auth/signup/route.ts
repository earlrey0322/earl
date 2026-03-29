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

    const { email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: "Missing: email, password, fullName, role" }, { status: 400 });
    }

    if (role === "company_owner" && (!worklifeAnswer || worklifeAnswer.toUpperCase() !== "SUSTAINABILITY")) {
      return NextResponse.json({ error: "Company owners must answer SUSTAINABILITY" }, { status: 403 });
    }
    if (role === "branch_owner" && (!worklifeAnswer || worklifeAnswer.toUpperCase() !== "ENVIRONMENT")) {
      return NextResponse.json({ error: "Branch owners must answer ENVIRONMENT" }, { status: 403 });
    }

    let user;
    try {
      user = await store.createUser({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        phoneBrand: phoneBrand || undefined,
        contactNumber: contactNumber || undefined,
        address: address || undefined,
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "Email already registered") {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      return NextResponse.json({ error: "Create user failed: " + String(e) }, { status: 500 });
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
    return NextResponse.json({ error: "Signup crash: " + String(e) }, { status: 500 });
  }
}
