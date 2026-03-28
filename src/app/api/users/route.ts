import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuthUser } from "@/lib/api-auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "company_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        contactNumber: users.contactNumber,
        address: users.address,
        isSubscribed: users.isSubscribed,
        subscriptionExpiry: users.subscriptionExpiry,
        createdAt: users.createdAt,
      })
      .from(users);

    const branchOwners = allUsers.filter((u) => u.role === "branch_owner");
    const customers = allUsers.filter((u) => u.role === "customer");
    const subscribedBranchOwners = branchOwners.filter((u) => u.isSubscribed);
    const subscribedCustomers = customers.filter((u) => u.isSubscribed);

    return NextResponse.json({
      totalUsers: allUsers.length,
      totalBranchOwners: branchOwners.length,
      totalCustomers: customers.length,
      subscribedBranchOwners: subscribedBranchOwners.length,
      subscribedCustomers: subscribedCustomers.length,
      users: allUsers,
    });
  } catch (error) {
    console.error("Users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
