import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "company_owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const allUsers = await db.select().from(users);
    const branchOwners = allUsers.filter((u) => u.role === "branch_owner");
    const customers = allUsers.filter((u) => u.role === "customer");
    return NextResponse.json({
      totalUsers: allUsers.length,
      totalBranchOwners: branchOwners.length,
      totalCustomers: customers.length,
      subscribedBranchOwners: branchOwners.filter((u) => u.isSubscribed).length,
      subscribedCustomers: customers.filter((u) => u.isSubscribed).length,
      users: allUsers.map((u) => ({
        id: u.id, email: u.email, fullName: u.fullName, role: u.role,
        contactNumber: u.contactNumber, isSubscribed: u.isSubscribed,
        subscriptionPlan: u.subscriptionPlan, subscriptionExpiry: u.subscriptionExpiry,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
