import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "company_owner") {
      return NextResponse.json({ error: "Unauthorized", totalRevenue: 0 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not set up", totalRevenue: 0 });
    }

    // Get total revenue from company_revenue table (non-refundable)
    const { data, error } = await supabase
      .from("company_revenue")
      .select("amount");

    if (error) {
      return NextResponse.json({ error: error.message, totalRevenue: 0 });
    }

    const totalRevenue = (data || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

    return NextResponse.json({ totalRevenue });
  } catch (e) {
    return NextResponse.json({ error: "Server error: " + String(e), totalRevenue: 0 });
  }
}
