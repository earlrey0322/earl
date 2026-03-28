import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Worklife verification
    if (role === "company_owner" && worklifeAnswer?.toUpperCase() !== "SUSTAINABILITY") {
      return NextResponse.json(
        { error: "Invalid worklife answer. Company owners must answer SUSTAINABILITY." },
        { status: 403 }
      );
    }
    if (role === "branch_owner" && worklifeAnswer?.toUpperCase() !== "ENVIRONMENT") {
      return NextResponse.json(
        { error: "Invalid worklife answer. Branch owners must answer ENVIRONMENT." },
        { status: 403 }
      );
    }

    // Check if email exists
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        fullName,
        role,
        phoneBrand: phoneBrand || null,
        contactNumber: contactNumber || null,
        address: address || null,
        worklifeAnswer: worklifeAnswer || null,
        gcashNumber: null,
      })
      .returning();

    // Create notification for company owner
    await db.insert(notifications).values({
      recipientEmail: "earlrey0322@gmail.com",
      subject: `New Account Created - ${role}`,
      message: `${fullName} (${email}) has created a new account as ${role}. Worklife: ${worklifeAnswer || "N/A"}`,
      type: "new_account",
    });

    const token = await createToken({
      userId: newUser[0].id,
      email: newUser[0].email,
      role: newUser[0].role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        fullName: newUser[0].fullName,
        role: newUser[0].role,
        isSubscribed: newUser[0].isSubscribed,
      },
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
