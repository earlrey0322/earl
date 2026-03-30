import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const auth = await getAuthUser();
    
    if (!auth || auth.role !== "company_owner") {
      return NextResponse.json({ error: "Unauthorized", users: [], totalUsers: 0, totalBranchOwners: 0, totalOtherBranches: 0, totalCustomers: 0, totalCompanyOwners: 0 }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not set up", users: [], totalUsers: 0, totalBranchOwners: 0, totalOtherBranches: 0, totalCustomers: 0, totalCompanyOwners: 0 });
    }

    // Get ALL users from Supabase
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message, users: [], totalUsers: 0, totalBranchOwners: 0, totalOtherBranches: 0, totalCustomers: 0, totalCompanyOwners: 0 });
    }

    // Map all users
    const allUsers = (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name || "",
      role: u.role,
      contactNumber: u.contact_number || "",
      isSubscribed: !!u.is_subscribed,
      subscriptionPlan: u.subscription_plan || null,
      subscriptionExpiry: u.subscription_expiry || null,
    }));

    // Filter out company_owner from displayed users (but count them)
    const users = allUsers.filter((u: any) => u.role !== "company_owner");
    
    const bo = users.filter((u: any) => u.role === "branch_owner");
    const ob = users.filter((u: any) => u.role === "other_branch");
    const cu = users.filter((u: any) => u.role === "customer");
    const co = allUsers.filter((u: any) => u.role === "company_owner");

    return NextResponse.json({
      totalUsers: users.length,
      totalBranchOwners: bo.length,
      totalOtherBranches: ob.length,
      totalCustomers: cu.length,
      totalCompanyOwners: co.length,
      subscribedBranchOwners: bo.filter((u: any) => u.isSubscribed).length,
      subscribedOtherBranches: ob.filter((u: any) => u.isSubscribed).length,
      subscribedCustomers: cu.filter((u: any) => u.isSubscribed).length,
      users,
    });
  } catch (e) {
    return NextResponse.json({ error: "Server error: " + String(e), users: [], totalUsers: 0, totalBranchOwners: 0, totalOtherBranches: 0, totalCustomers: 0, totalCompanyOwners: 0 });
  }
}
