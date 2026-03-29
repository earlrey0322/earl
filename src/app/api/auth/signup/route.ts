import { NextResponse } from "next/server";
import { getDb } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const { email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = await req.json();

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Worklife verification
    if (role === "company_owner" && worklifeAnswer?.toUpperCase() !== "SUSTAINABILITY") {
      return NextResponse.json({ error: "Invalid verification answer" }, { status: 403 });
    }
    if (role === "branch_owner" && worklifeAnswer?.toUpperCase() !== "ENVIRONMENT") {
      return NextResponse.json({ error: "Invalid verification answer" }, { status: 403 });
    }

    const db = getDb();

    // Check if email already exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.trim());
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Insert user
    const result = db.prepare(`
      INSERT INTO users (email, password, full_name, role, phone_brand, contact_number, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(email.trim(), password, fullName.trim(), role, phoneBrand || null, contactNumber || null, address || null);

    const userId = result.lastInsertRowid;

    // Create notification for company owner
    db.prepare(`
      INSERT INTO notifications (recipient_email, subject, message, type)
      VALUES (?, ?, ?, ?)
    `).run("earlrey0322@gmail.com", `New ${role} - ${fullName}`, `${fullName} (${email}) signed up as ${role}`, "signup");

    const token = btoa(JSON.stringify({ id: userId, email: email.trim(), role }));
    const res = NextResponse.json({
      success: true,
      user: { id: userId, email: email.trim(), fullName: fullName.trim(), role, isSubscribed: false },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
