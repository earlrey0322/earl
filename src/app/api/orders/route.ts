import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";

const PRODUCTS = [
  { id: "pspcs", name: "PSPCS Charging Station", price: 25000, desc: "Solar powered, 3.6VDC output" },
  { id: "pspcs2", name: "PSPCS (2 Units)", price: 48000, desc: "Two stations bundle" },
  { id: "pspcs3", name: "PSPCS (3 Units)", price: 70000, desc: "Three stations bundle" },
];

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const G = globalThis as any;
    const orders = G._o || [];
    const filtered = auth.role === "company_owner" ? orders : orders.filter((o: any) => o.userId === auth.id);
    return NextResponse.json({ orders: filtered, products: PRODUCTS });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.buyerName || !body.buyerPhone || !body.buyerAddress || !body.product || !body.totalPrice) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    const G = globalThis as any;
    if (!G._o) G._o = [];
    if (!G._oid) G._oid = 100;
    const order = { id: G._oid++, userId: auth.id, ...body, status: "pending", createdAt: Date.now() };
    G._o.push(order);
    return NextResponse.json({ success: true, order });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const G = globalThis as any;
    if (G._o && body.id && body.status) {
      const order = G._o.find((o: any) => o.id === body.id);
      if (order) order.status = body.status;
    }
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
