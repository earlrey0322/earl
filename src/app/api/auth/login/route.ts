import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getStore } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabase()!;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login") || authError.message.includes("Invalid credentials")) {
          return NextResponse.json({ error: "Wrong password" }, { status: 401 });
        }
        if (authError.message.includes("not found") || authError.message.includes("User not found")) {
          return NextResponse.json({ error: "Account not found" }, { status: 401 });
        }
        return NextResponse.json({ error: authError.message }, { status: 401 });
      }

      if (!authData.user) {
        return NextResponse.json({ error: "Login failed" }, { status: 401 });
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.trim())
        .single();

      if (profileError || !profile) {
        const { data: newProfile } = await supabase
          .from("users")
          .upsert({
            id: Number(authData.user.id),
            email: email.trim(),
            password: password,
            full_name: authData.user.email?.split("@")[0] || "User",
            role: "customer",
            is_subscribed: false,
          })
          .select()
          .single();

        const userData = newProfile || profile;
        if (!userData) {
          return NextResponse.json({ error: "Failed to load user profile" }, { status: 500 });
        }

        const token = btoa(JSON.stringify({ id: userData.id, email: userData.email, role: userData.role }));
        const res = NextResponse.json({
          success: true,
          user: { id: userData.id, email: userData.email, fullName: userData.full_name, role: userData.role, isSubscribed: userData.is_subscribed || false },
        });
        res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
        return res;
      }

      await supabase.from("notifications").insert({
        recipient_email: "earlrey0322@gmail.com",
        subject: `Login - ${profile.full_name}`,
        message: `${profile.full_name} (${profile.email}) logged in as ${profile.role}`,
        type: "login",
      });

      const token = btoa(JSON.stringify({ id: profile.id, email: profile.email, role: profile.role }));
      const res = NextResponse.json({
        success: true,
        user: { id: profile.id, email: profile.email, fullName: profile.full_name, role: profile.role, isSubscribed: profile.is_subscribed || false },
      });
      res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
      return res;
    }

    // Fallback to local store
    const { users } = getStore();
    const user = users.find((u: any) => u.email === email.trim());
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 401 });
    if (user.password !== password) return NextResponse.json({ error: "Wrong password" }, { status: 401 });

    const token = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }));
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isSubscribed: user.isSubscribed },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
