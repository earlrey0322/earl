import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getStore } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: "Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
        setupRequired: true,
      }, { status: 503 });
    }

    const supabase = getSupabase()!;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("email not confirmed") || msg.includes("email not verified")) {
        return NextResponse.json({
          error: "Please confirm your email before logging in. Check your inbox for the verification link.",
          emailNotConfirmed: true,
        }, { status: 401 });
      }
      if (msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("invalid password")) {
        return NextResponse.json({ error: "Wrong password" }, { status: 401 });
      }
      if (msg.includes("user not found") || msg.includes("no user")) {
        return NextResponse.json({ error: "Account not found" }, { status: 401 });
      }
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Login failed" }, { status: 401 });
    }

    // Check email confirmation
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json({
        error: "Please confirm your email before logging in. Check your inbox for the verification link.",
        emailNotConfirmed: true,
      }, { status: 401 });
    }

    // Get or create user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim())
      .single();

    let userData = profile;

    if (profileError || !profile) {
      // Create profile if doesn't exist
      const { data: newProfile } = await supabase
        .from("users")
        .upsert({
          id: Number(authData.user.id),
          email: email.trim(),
          password: password,
          full_name: authData.user.user_metadata?.full_name || authData.user.email?.split("@")[0] || "User",
          role: authData.user.user_metadata?.role || "customer",
          is_subscribed: false,
        })
        .select()
        .single();
      userData = newProfile;
    }

    if (!userData) {
      return NextResponse.json({ error: "Failed to load user profile" }, { status: 500 });
    }

    // Create login notification
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Login - ${userData.full_name}`,
      message: `${userData.full_name} (${userData.email}) logged in as ${userData.role}`,
      type: "login",
    });

    const token = btoa(JSON.stringify({ id: userData.id, email: userData.email, role: userData.role }));
    const res = NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        isSubscribed: userData.is_subscribed || false,
      },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;

  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
