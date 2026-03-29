import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";

const PLANS = [
  { id: "1day", label: "1 Day", days: 1, price: 15 },
  { id: "1week", label: "1 Week", days: 7, price: 50 },
  { id: "1month", label: "1 Month", days: 30, price: 120 },
  { id: "1year", label: "1 Year", days: 365, price: 300 },
];

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const G = globalThis as any;
    if (!G._u) return NextResponse.json({ isSubscribed: false, plans: PLANS });
    const user = G._u.find((u: any) => u.id === auth.id);
    return NextResponse.json({ isSubscribed: user?.isSubscribed || false, plan: user?.subPlan || null, plans: PLANS });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const plan = PLANS.find(p => p.id === body.planId);
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    const G = globalThis as any;
    const userId = (auth.role === "company_owner" && body.targetUserId) ? body.targetUserId : auth.id;
    if (G._u) {
      const user = G._u.find((u: any) => u.id === userId);
      if (user) { user.isSubscribed = true; user.subPlan = plan.id; user.subExpiry = Date.now() + plan.days * 86400000; }
    }
    return NextResponse.json({ success: true, gcash: { number: "09469086926", name: "Earl Christian Rey", amount: plan.price } });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "company_owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const G = globalThis as any;
    if (G._u && body.targetUserId) {
      const user = G._u.find((u: any) => u.id === body.targetUserId);
      if (user) { user.isSubscribed = false; user.subPlan = null; user.subExpiry = null; }
    }
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
