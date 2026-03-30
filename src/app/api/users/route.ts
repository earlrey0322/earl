import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const auth = await getAuthUser();
    console.log("Users API - Auth user:", auth);
    
    if (!auth || auth.role !== "company_owner") {
      console.log("Users API - Unauthorized, auth:", auth);
      return NextResponse.json({ error: "Unauthorized", auth: auth }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      console.log("Users API - No Supabase connection");
      return NextResponse.json({ error: "Database not set up" });
    }

    console.log("Users API - Querying users table...");
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, contact_number, is_subscribed, subscription_plan, subscription_expiry, created_at")
      .order("created_at", { ascending: false });

    console.log("Users API - Query result:", { data, error, count: data?.length });

    if (error) {
      console.log("Users API - Query error:", error.message);
      return NextResponse.json({ error: error.message });
    }

    // Filter out company_owner from the results (not from the query)
    const filteredData = (data || []).filter((u: any) => u.role !== "company_owner");
    console.log("Users API - Filtered users count:", filteredData.length);

    const users = filteredData.map((u: any) => ({
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

    const response = {
      totalUsers: users.length,
      totalBranchOwners: bo.length,
      totalOtherBranches: ob.length,
      totalCustomers: cu.length,
      subscribedBranchOwners: bo.filter((u) => u.isSubscribed).length,
      subscribedOtherBranches: ob.filter((u) => u.isSubscribed).length,
      subscribedCustomers: cu.filter((u) => u.isSubscribed).length,
      users,
    };
    
    console.log("Users API - Response:", response);
    return NextResponse.json(response);
  } catch (e) { 
    console.log("Users API - Server error:", e);
    return NextResponse.json({ error: "Server error: " + String(e) }, { status: 500 }); 
  }
}
