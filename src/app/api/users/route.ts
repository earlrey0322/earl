import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "company_owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const G = globalThis as any;
    const users = (G._u || []).filter((u: any) => u.role !== "company_owner");
    const bo = users.filter((u: any) => u.role === "branch_owner");
    const cu = users.filter((u: any) => u.role === "customer");
    return NextResponse.json({
      totalUsers: users.length, totalBranchOwners: bo.length, totalCustomers: cu.length,
      subscribedBranchOwners: bo.filter((u: any) => u.isSubscribed).length,
      subscribedCustomers: cu.filter((u: any) => u.isSubscribed).length,
      users: users.map((u: any) => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role, contactNumber: u.contactNumber, isSubscribed: u.isSubscribed, subPlan: u.subPlan })),
    });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
