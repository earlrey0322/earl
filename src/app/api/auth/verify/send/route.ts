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

    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      return NextResponse.json({ 
        error: "RESEND_API_KEY not found in environment variables. Add it in Cloudflare Workers → Settings → Variables"
      });
    }

    const resend = new Resend(resendApiKey);
    
    const { data, error: emailError } = await resend.emails.send({
      from: "PSPCS <onboarding@resend.dev>",
      to: email.trim().toLowerCase(),
      subject: "Your PSPCS Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f172a; text-align: center;">PSPCS Email Verification</h2>
          <p style="color: #64748b; text-align: center;">Your verification code for KLEOXM 111</p>
          <div style="background: #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px 0;">Your verification code is</p>
            <p style="color: #f59e0b; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0;">${code}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">This code expires in 10 minutes.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Resend error:", JSON.stringify(emailError));
      // Check if it's a domain verification issue
      const errorMsg = emailError.message || JSON.stringify(emailError);
      if (errorMsg.includes("domain") || errorMsg.includes("verify")) {
        return NextResponse.json({ 
          error: "Email domain not verified. In Resend dashboard, go to Domains and verify your email domain, or use a verified email address." 
        });
      }
      return NextResponse.json({ error: "Failed to send email: " + errorMsg });
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
    console.error("Verification error:", e);
    return NextResponse.json({ error: "Error: " + String(e) });
  }
}
