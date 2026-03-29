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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (role === "company_owner" && worklifeAnswer?.toUpperCase() !== "SUSTAINABILITY") {
      return NextResponse.json({ error: "Company owners must answer SUSTAINABILITY" }, { status: 403 });
    }
    if (role === "branch_owner" && worklifeAnswer?.toUpperCase() !== "ENVIRONMENT") {
      return NextResponse.json({ error: "Branch owners must answer ENVIRONMENT" }, { status: 403 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email.trim()));
    if (existing.length > 0) {
      return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.insert(users).values({
      email: email.trim(),
      password: hashedPassword,
      fullName: fullName.trim(),
      role,
      phoneBrand: phoneBrand || null,
      contactNumber: contactNumber || null,
      address: address || null,
      worklifeAnswer: worklifeAnswer || null,
    }).returning();

    await db.insert(notifications).values({
      recipientEmail: "earlrey0322@gmail.com",
      subject: `New Account - ${role}`,
      message: `${fullName} (${email}) signed up as ${role}`,
      type: "new_account",
    });

    const token = await createToken({ userId: newUser[0].id, email: newUser[0].email, role: newUser[0].role });
    const response = NextResponse.json({
      success: true,
      user: { id: newUser[0].id, email: newUser[0].email, fullName: newUser[0].fullName, role: newUser[0].role, isSubscribed: newUser[0].isSubscribed },
    });
    response.cookies.set("auth_token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
