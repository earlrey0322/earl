import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getStore, persistData } from "@/lib/data";

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

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: "Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables in your deployment settings.",
        setupRequired: true,
      }, { status: 503 });
    }

    const supabase = getSupabase()!;

    // Sign up with email confirmation - Supabase will send verification email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || ""}/auth/callback`,
      },
    });

    if (authError) {
      if (authError.message.includes("already registered") || authError.message.includes("already exists") || authError.message.includes("already in use")) {
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
    }

    // Create notification for company owner
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `New ${role} - ${fullName}`,
      message: `${fullName} (${email}) signed up as ${role}`,
      type: "signup",
    });

    // Check if email confirmation is required
    const emailConfirmed = authData.user.email_confirmed_at != null;

    if (!emailConfirmed) {
      // Email not yet confirmed - return message to check email
      return NextResponse.json({
        success: true,
        emailConfirmationRequired: true,
        message: "Please check your email to confirm your account before logging in.",
      });
    }

    // Email already confirmed (if email confirmation is disabled in Supabase)
    const token = btoa(JSON.stringify({ id: Number(authData.user.id), email: authData.user.email, role }));
    const res = NextResponse.json({
      success: true,
      user: { id: Number(authData.user.id), email: authData.user.email, fullName: fullName.trim(), role, isSubscribed: false },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;

  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
