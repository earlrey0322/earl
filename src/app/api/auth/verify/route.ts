import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not set up" });
    }

    // Check the verification code
    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (fetchError || !verification) {
      return NextResponse.json({ error: "No verification code found. Please request a new one." });
    }

    // Check if code matches
    if (verification.code !== code) {
      return NextResponse.json({ error: "Invalid verification code" });
    }

    // Check if code has expired
    const expiresAt = new Date(verification.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." });
    }

    // Code is valid - delete it so it can't be reused
    await supabase
      .from("email_verifications")
      .delete()
      .eq("email", email.trim().toLowerCase());

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Verification error:", e);
    return NextResponse.json({ error: "Error: " + String(e) });
  }
}
