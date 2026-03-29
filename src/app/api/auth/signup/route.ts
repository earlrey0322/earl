import { NextResponse } from "next/server";
import { findUserByEmail, addUser, addNotification } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: "Missing fields" });
    }

    if (role === "company_owner" && String(worklifeAnswer || "").toUpperCase() !== "SUSTAINABILITY") {
      return NextResponse.json({ error: "Invalid verification answer" });
    }
    if (role === "branch_owner" && String(worklifeAnswer || "").toUpperCase() !== "ENVIRONMENT") {
      return NextResponse.json({ error: "Invalid verification answer" });
    }

    if (findUserByEmail(email)) {
      return NextResponse.json({ error: "Email already registered" });
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

    const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role })).toString("base64");
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, isSubscribed: false } });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Server error: " + String(e) });
  }
}
