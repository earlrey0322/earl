import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, fullName, role, phoneBrand, contactNumber, address, worklifeAnswer } = body;

    if (!username || !password || !fullName || !role || !worklifeAnswer) {
      return NextResponse.json({ error: "All fields required" });
    }

    // Validate worklife answer (without showing hints)
    const validAnswers: Record<string, string[]> = {
      "company_owner": ["SUSTAINABILITY"],
      "branch_owner": ["ENVIRONMENT"],
      "other_branch": ["DEVELOPMENT"],
    };

    const allowedAnswers = validAnswers[role] || [];
    if (allowedAnswers.length > 0 && !allowedAnswers.includes(worklifeAnswer.toUpperCase().trim())) {
      return NextResponse.json({ error: "Invalid worklife answer" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not set up" });
    }

    // Check if username exists
    const { data: existing } = await supabase.from("users").select("id").eq("email", username.trim().toLowerCase()).single();
    if (existing) {
      return NextResponse.json({ error: "Username already taken" });
    }

    // Company owners get lifetime premium automatically
    const isPremium = role === "company_owner";
    const userId = Date.now();
    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      email: username.trim().toLowerCase(),
      password: password,
      full_name: fullName.trim(),
      role,
      phone_brand: phoneBrand || null,
      contact_number: contactNumber || null,
      address: address || null,
      is_subscribed: isPremium,
      subscription_plan: isPremium ? "lifetime" : null,
    });

    if (insertError) {
      return NextResponse.json({ error: "Signup failed: " + insertError.message });
    }

    // Notify company owner (in-app)
    await supabase.from("notifications").insert({
      recipient_email: "company_owner",
      subject: `New ${role.replace("_", " ")} - ${fullName}`,
      message: `${fullName} (${username}) signed up as ${role}${isPremium ? " (LIFETIME PREMIUM)" : ""}`,
      type: "signup",
    });

    // Notify earlrey0322@gmail.com (in-app)
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `New ${role} - ${fullName}`,
      message: `${fullName} (${username}) signed up as ${role}${isPremium ? " (LIFETIME PREMIUM)" : ""}`,
      type: "signup",
    });

    const token = Buffer.from(JSON.stringify({ id: userId, username: username.trim().toLowerCase(), role })).toString("base64");
    const res = NextResponse.json({
      success: true,
      user: { id: userId, username: username.trim().toLowerCase(), fullName: fullName.trim(), role, isSubscribed: isPremium },
    });
    res.cookies.set("token", token, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 604800, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Error: " + String(e) });
  }
}
