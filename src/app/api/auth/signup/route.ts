import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: "All fields required" });
    }

    if (role === "company_owner" && String(worklifeAnswer || "").toUpperCase() !== "SUSTAINABILITY") {
      return NextResponse.json({ error: "Invalid verification" });
    }
    if (role === "branch_owner" && String(worklifeAnswer || "").toUpperCase() !== "ENVIRONMENT") {
      return NextResponse.json({ error: "Invalid verification" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not set up. Go to your deployment settings and add SUPABASE_URL and SUPABASE_ANON_KEY." });
    }

    // Check if email exists
    const { data: existing } = await supabase.from("users").select("id").eq("email", email.trim()).single();
    if (existing) {
      return NextResponse.json({ error: "Email already registered" });
    }

    // Create user with numeric ID
    const userId = Date.now();
    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      email: email.trim(),
      password: password,
      full_name: fullName.trim(),
      role,
      phone_brand: phoneBrand || null,
      contact_number: contactNumber || null,
      address: address || null,
      is_subscribed: false,
    });

    if (insertError) {
      return NextResponse.json({ error: "Signup failed: " + insertError.message });
    }

    // Notify
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `New ${role} - ${fullName}`,
      message: `${fullName} (${email}) signed up as ${role}`,
      type: "signup",
    });

    const token = Buffer.from(JSON.stringify({ id: userId, email: email.trim(), role })).toString("base64");
    const res = NextResponse.json({
      success: true,
      user: { id: userId, email: email.trim(), fullName: fullName.trim(), role, isSubscribed: false },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Error: " + String(e) });
  }
}
