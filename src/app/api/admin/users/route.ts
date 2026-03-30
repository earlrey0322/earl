import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

// GET - list all users (company owner only)
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });
    if (auth.role !== "company_owner") return NextResponse.json({ error: "Only company owner can view users" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, is_subscribed, subscription_plan, created_at")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ users: users || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

// PATCH - toggle premium for a user (company owner only)
export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });
    if (auth.role !== "company_owner") return NextResponse.json({ error: "Only company owner can manage premium" });

    const body = await req.json();
    const { userId, isPremium } = body;

    if (!userId) return NextResponse.json({ error: "userId required" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const updateData: any = {
      is_subscribed: isPremium,
      subscription_plan: isPremium ? "lifetime" : null,
    };
    
    // Clear expiry when removing premium
    if (!isPremium) {
      updateData.subscription_expiry = null;
    }

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) return NextResponse.json({ error: error.message });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
