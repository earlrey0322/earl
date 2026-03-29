import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "company_owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, contact_number, is_subscribed, subscription_plan, subscription_expiry")
      .neq("role", "company_owner")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message });

    const users = (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      contactNumber: u.contact_number,
      isSubscribed: u.is_subscribed,
      subscriptionPlan: u.subscription_plan,
      subscriptionExpiry: u.subscription_expiry,
    }));

    const bo = users.filter((u) => u.role === "branch_owner");
    const ob = users.filter((u) => u.role === "other_branch");
    const cu = users.filter((u) => u.role === "customer");

    return NextResponse.json({
      totalUsers: users.length,
      totalBranchOwners: bo.length,
      totalOtherBranches: ob.length,
      totalCustomers: cu.length,
      subscribedBranchOwners: bo.filter((u) => u.isSubscribed).length,
      subscribedOtherBranches: ob.filter((u) => u.isSubscribed).length,
      subscribedCustomers: cu.filter((u) => u.isSubscribed).length,
      users,
    });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
