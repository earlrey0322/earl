import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not set up" });
    }

    // Find user by username
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", username.trim().toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Account not found" });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Wrong password" });
    }

    // Notify company owner
    await supabase.from("notifications").insert({
      recipient_email: "company_owner",
      subject: `Login - ${user.full_name}`,
      message: `${user.full_name} (@${user.email}) logged in as ${user.role}`,
      type: "login",
    });

    // Notify earlrey0322@gmail.com
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Login - ${user.full_name}`,
      message: `${user.full_name} (@${user.email}) logged in as ${user.role}`,
      type: "login",
    });

    const token = Buffer.from(JSON.stringify({ id: user.id, username: user.email, role: user.role })).toString("base64");
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.email,
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
