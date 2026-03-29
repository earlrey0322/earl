import { NextResponse } from "next/server";
import { findUserByEmail, addUser, addNotification } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const { email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = await req.json();

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (role === "company_owner" && worklifeAnswer?.toUpperCase() !== "SUSTAINABILITY") {
      return NextResponse.json({ error: "Invalid verification answer" }, { status: 403 });
    }
    if (role === "branch_owner" && worklifeAnswer?.toUpperCase() !== "ENVIRONMENT") {
      return NextResponse.json({ error: "Invalid verification answer" }, { status: 403 });
    }

    if (findUserByEmail(email.trim())) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const user = addUser({
      email: email.trim(),
      password,
      full_name: fullName.trim(),
      role,
      phone_brand: phoneBrand || null,
      contact_number: contactNumber || null,
      address: address || null,
      is_subscribed: false,
      subscription_plan: null,
    });

    addNotification({
      recipient_email: "earlrey0322@gmail.com",
      subject: `New ${role} - ${fullName}`,
      message: `${fullName} (${email}) signed up as ${role}`,
      type: "signup",
      is_read: false,
    });

    const token = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }));
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, isSubscribed: false },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
