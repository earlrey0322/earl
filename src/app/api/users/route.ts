import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "company_owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const all = store.getAllUsers().filter(u => u.role !== "company_owner");
    const bo = all.filter(u => u.role === "branch_owner");
    const cu = all.filter(u => u.role === "customer");
    return NextResponse.json({
      totalUsers: all.length, totalBranchOwners: bo.length, totalCustomers: cu.length,
      subscribedBranchOwners: bo.filter(u => u.isSubscribed).length,
      subscribedCustomers: cu.filter(u => u.isSubscribed).length,
      users: all.map(u => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role, contactNumber: u.contactNumber, isSubscribed: u.isSubscribed, subscriptionPlan: u.subscriptionPlan })),
    });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
