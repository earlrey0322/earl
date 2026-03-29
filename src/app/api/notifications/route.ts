import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });

    // Company owner sees all, others see their own
    if (auth.role !== "company_owner") {
      query = query.eq("recipient_email", auth.email);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message });

    const notifications = (data || []).map((n: any) => ({
      id: n.id,
      subject: n.subject,
      message: n.message,
      type: n.type,
      isRead: n.is_read,
      createdAt: n.created_at,
    }));

    return NextResponse.json({ notifications });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const { error } = await supabase.from("notifications").insert({
      recipient_email: body.recipientEmail,
      subject: body.subject,
      message: body.message,
      type: body.type || "general",
      is_read: false,
    });

    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
