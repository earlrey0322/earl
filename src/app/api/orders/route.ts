import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = store.findUserById(auth.id);
    const orders = auth.role === "company_owner" ? store.getAllOrders() : store.getAllOrders().filter(o => o.userId === auth.id);
    return NextResponse.json({ orders });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (!body.buyerName || !body.buyerPhone || !body.buyerAddress || !body.product || !body.totalPrice) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    const order = store.addOrder({ userId: auth.id, buyerName: body.buyerName, buyerPhone: body.buyerPhone, buyerAddress: body.buyerAddress, product: body.product, quantity: body.quantity || 1, totalPrice: body.totalPrice, status: "pending" });
    return NextResponse.json({ success: true, order });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (body.id && body.status) store.updateOrder(body.id, body.status);
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 500 }); }
}
