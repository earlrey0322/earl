import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY." }, { status: 503 });
    }

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (authError) {
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    // Insert user profile into users table
    const { error: profileError } = await supabase.from("users").insert({
      id: Number(authData.user.id),
      email: email.trim(),
      password: password,
      full_name: fullName.trim(),
      role,
      phone_brand: phoneBrand || null,
      contact_number: contactNumber || null,
      address: address || null,
      is_subscribed: false,
    });

    if (profileError) {
      console.error("Profile insert error:", profileError);
      // Still return success since auth user was created
    }

    // Create notification
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `New ${role} - ${fullName}`,
      message: `${fullName} (${email}) signed up as ${role}`,
      type: "signup",
    });

    const token = btoa(JSON.stringify({
      id: Number(authData.user.id),
      email: authData.user.email,
      role,
    }));

    const res = NextResponse.json({
      success: true,
      user: {
        id: Number(authData.user.id),
        email: authData.user.email,
        fullName: fullName.trim(),
        role,
        isSubscribed: false,
      },
    });

    res.cookies.set("token", token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 604800,
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
