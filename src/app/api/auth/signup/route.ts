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
      return NextResponse.json({ error: "Missing required fields (email, password, fullName, role)" }, { status: 400 });
    }

    // Worklife verification (only for company_owner and branch_owner)
    if (role === "company_owner") {
      if (!worklifeAnswer || worklifeAnswer.toUpperCase() !== "SUSTAINABILITY") {
        return NextResponse.json({ error: "Company owners must answer SUSTAINABILITY for worklife" }, { status: 403 });
      }
    }
    if (role === "branch_owner") {
      if (!worklifeAnswer || worklifeAnswer.toUpperCase() !== "ENVIRONMENT") {
        return NextResponse.json({ error: "Branch owners must answer ENVIRONMENT for worklife" }, { status: 403 });
      }
    }

    // Create user
    let user;
    try {
      user = await store.createUser({ email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer });
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "Email already registered") {
        return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
      }
      console.error("Create user error:", e);
      return NextResponse.json({ error: "Failed to create account: " + String(e) }, { status: 500 });
    }

    // Notification
    try {
      store.addNotification({
        recipientEmail: "earlrey0322@gmail.com",
        subject: `New Account - ${role}`,
        message: `${fullName} (${email}) signed up as ${role}`,
        type: "new_account",
        isRead: false,
      });
    } catch {}

    // Create token
    let token: string;
    try {
      token = await createToken({ userId: user.id, email: user.email, role: user.role });
    } catch (e) {
      console.error("Token error:", e);
      return NextResponse.json({ error: "Account created but session failed" }, { status: 500 });
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
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Server error: " + String(error) }, { status: 500 });
  }
}
