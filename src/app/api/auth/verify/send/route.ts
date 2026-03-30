import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import nodemailer from "nodemailer";

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

    // Send email using Nodemailer with Gmail SMTP
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      // Fallback: Log code to console for testing
      console.log(`[EMAIL VERIFICATION] Code for ${email}: ${code}`);
      console.log("Set GMAIL_USER and GMAIL_APP_PASSWORD to send actual emails.");

      // Still notify company owner
      await supabase.from("notifications").insert({
        recipient_email: "company_owner",
        subject: "New Verification Request",
        message: `${email} is verifying their email for PSPCS signup. Code logged to console (email not configured).`,
        type: "verification",
      });

      await supabase.from("notifications").insert({
        recipient_email: "earlrey0322@gmail.com",
        subject: "New Verification Request",
        message: `${email} is verifying their email for PSPCS signup. Code logged to console (email not configured).`,
        type: "verification",
      });

      return NextResponse.json({
        success: true,
        message: "Verification code sent (check server console - email not configured)",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    const mailOptions = {
      from: `"PSPCS - KLEOXM 111" <${gmailUser}>`,
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
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">Powered Solar Piso Charging Station by KLEOXM 111</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL SENT] Verification code sent to ${email}`);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Return success but note email failed - code is still valid in DB
      return NextResponse.json({
        success: true,
        message: "Verification code generated but email delivery failed. Check server logs.",
      });
    }

    // Notify company owner (in-app)
    await supabase.from("notifications").insert({
      recipient_email: "company_owner",
      subject: "New Verification Request",
      message: `${email} is verifying their email for PSPCS signup.`,
      type: "verification",
    });

    // Notify earlrey0322@gmail.com (in-app)
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: "New Verification Request",
      message: `${email} is verifying their email for PSPCS signup.`,
      type: "verification",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Verification error:", e);
    return NextResponse.json({ error: "Error: " + String(e) });
  }
}
