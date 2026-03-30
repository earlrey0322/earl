import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" });
    }

    // Validate email format
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Invalid email format" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not set up" });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code in database
    await supabase.from("email_verifications").upsert({
      email: email.trim().toLowerCase(),
      code: code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

    // Send actual email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      return NextResponse.json({ 
        error: "Email service not configured. Please add RESEND_API_KEY in deployment settings.",
        code: code // Fallback for testing
      });
    }

    const resend = new Resend(resendApiKey);
    
    const { data, error: emailError } = await resend.emails.send({
      from: "PSPCS Verification <onboarding@resend.dev>",
      to: email.trim().toLowerCase(),
      subject: "Your PSPCS Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; margin: 0 auto; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #f97316); display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: bold; color: #0f172a;">K</span>
            </div>
          </div>
          <h2 style="color: #0f172a; text-align: center;">Email Verification</h2>
          <p style="color: #64748b; text-align: center;">Your verification code for PSPCS by KLEOXM 111</p>
          <div style="background: #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px 0;">Your verification code is</p>
            <p style="color: #f59e0b; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0;">${code}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">This code expires in 10 minutes.</p>
          <p style="color: #64748b; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json({ error: "Failed to send email: " + emailError.message });
    }

    // Notify company owner
    await supabase.from("notifications").insert({
      recipient_email: "company_owner",
      subject: "New Verification Request",
      message: `${email} is verifying their email for PSPCS signup.`,
      type: "verification",
    });

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (e) {
    return NextResponse.json({ error: "Error: " + String(e) });
  }
}
