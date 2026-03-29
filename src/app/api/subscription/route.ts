import { NextResponse } from "next/server";
import { store, PLANS } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = store.findUserById(auth.userId);
    return NextResponse.json({ isSubscribed: user?.isSubscribed || false, plan: user?.subscriptionPlan || null, plans: PLANS });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const plan = PLANS.find(p => p.id === body.planId);
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const userId = (auth.role === "company_owner" && body.targetUserId) ? body.targetUserId : auth.userId;
    const expiry = Date.now() + plan.days * 24 * 60 * 60 * 1000;
    store.updateUser(userId, { isSubscribed: true, subscriptionPlan: plan.id, subscriptionExpiry: expiry });

    return NextResponse.json({ success: true, gcashDetails: { number: "09469086926", name: "Earl Christian Rey", amount: plan.price } });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "company_owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (body.targetUserId) store.updateUser(body.targetUserId, { isSubscribed: false, subscriptionPlan: null, subscriptionExpiry: null });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 500 }); }
}
