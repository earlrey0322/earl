import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not set up" });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code
    await supabase.from("email_verifications").upsert({
      email: email.trim().toLowerCase(),
      code: code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      created_at: new Date().toISOString(),
    });

    // Send notification to user
    await supabase.from("notifications").insert({
      recipient_email: email.trim().toLowerCase(),
      subject: "Email Verification Code",
      message: `Your verification code is: ${code}. This code expires in 10 minutes.`,
      type: "verification",
    });

    // Notify company owner
    await supabase.from("notifications").insert({
      recipient_email: "company_owner",
      subject: "New Verification Request",
      message: `${email} is verifying their email for PSPCS signup.`,
      type: "verification",
    });

    return NextResponse.json({ success: true, code: code });
  } catch (e) {
    return NextResponse.json({ error: "Error: " + String(e) });
  }
}
