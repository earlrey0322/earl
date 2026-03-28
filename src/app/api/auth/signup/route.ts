import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (role === "company_owner" && worklifeAnswer?.toUpperCase() !== "SUSTAINABILITY") {
      return NextResponse.json({ error: "Invalid worklife answer for company owner" }, { status: 403 });
    }
    if (role === "branch_owner" && worklifeAnswer?.toUpperCase() !== "ENVIRONMENT") {
      return NextResponse.json({ error: "Invalid worklife answer for branch owner" }, { status: 403 });
    }

    try {
      const user = await store.createUser({ email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer });

      store.addNotification({
        recipientEmail: "earlrey0322@gmail.com",
        subject: `New Account Created - ${role}`,
        message: `${fullName} (${email}) created a new account as ${role}`,
        type: "new_account",
        isRead: false,
      });

      const token = await createToken({ userId: user.id, email: user.email, role: user.role });

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
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "Email already registered") {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      throw e;
    }
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
