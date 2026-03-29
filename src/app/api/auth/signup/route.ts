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

    if (isSupabaseConfigured()) {
      const supabase = getSupabase()!;

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

      await supabase.from("notifications").insert({
        recipient_email: "earlrey0322@gmail.com",
        subject: `New ${role} - ${fullName}`,
        message: `${fullName} (${email}) signed up as ${role}`,
        type: "signup",
      });

      const token = btoa(JSON.stringify({ id: Number(authData.user.id), email: authData.user.email, role }));
      const res = NextResponse.json({
        success: true,
        user: { id: Number(authData.user.id), email: authData.user.email, fullName: fullName.trim(), role, isSubscribed: false },
      });
      res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
      return res;
    }

    // Fallback to local store
    const { users, uid } = getStore();
    if (users.find((u: any) => u.email === email.trim())) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const user = {
      id: uid(), email: email.trim(), password, fullName: fullName.trim(), role,
      phoneBrand: phoneBrand || null, contactNumber: contactNumber || null, address: address || null,
      isSubscribed: false, subPlan: null, subExpiry: null,
    };
    users.push(user);
    persistData();

    const token = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }));
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isSubscribed: false },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
