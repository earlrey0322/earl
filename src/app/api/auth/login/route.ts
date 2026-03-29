import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not set up. Go to your deployment settings and add SUPABASE_URL and SUPABASE_ANON_KEY." });
    }

    // Find user
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Account not found" });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Wrong password" });
    }

    // Notify
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Login - ${user.full_name}`,
      message: `${user.full_name} (${user.email}) logged in`,
      type: "login",
    });

    const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role })).toString("base64");
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isSubscribed: user.is_subscribed || false,
      },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Error: " + String(e) });
  }
}
