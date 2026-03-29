import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

export const PRODUCTS = [
  { id: "pspcs-basic", name: "PSPCS Basic Station", price: 3500, desc: "1 cable, solar panel, 3.6VDC output" },
  { id: "pspcs-standard", name: "PSPCS Standard Station", price: 5000, desc: "2 cables (Type-C + iPhone), solar panel" },
  { id: "pspcs-premium", name: "PSPCS Premium Station", price: 7500, desc: "3 cables + outlet, solar panel, inverter" },
  { id: "solar-panel", name: "Solar Panel Only", price: 2000, desc: "50W solar panel with rectifier" },
  { id: "cable-typec", name: "Type-C Cable", price: 150, desc: "Fast charging Type-C cable" },
  { id: "cable-iphone", name: "iPhone Cable", price: 200, desc: "Lightning cable for iPhone" },
  { id: "cable-universal", name: "Universal USB Cable", price: 100, desc: "USB-A charging cable" },
];

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await (await import("@/db")).db.select().from((await import("@/db/schema")).users).where(eq((await import("@/db/schema")).users.id, auth.userId));
    const role = user[0]?.role;

    // Company owner sees all orders, others see their own
    const allOrders = role === "company_owner"
      ? await db.select().from(orders).orderBy(desc(orders.createdAt))
      : await db.select().from(orders).where(eq(orders.userId, auth.userId)).orderBy(desc(orders.createdAt));

    return NextResponse.json({ orders: allOrders, products: PRODUCTS });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { buyerName, buyerPhone, buyerAddress, product, quantity, totalPrice, notes } = body;
    if (!buyerName || !buyerPhone || !buyerAddress || !product || !totalPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await (await import("@/db")).db.select().from((await import("@/db/schema")).users).where(eq((await import("@/db/schema")).users.id, auth.userId));

    const newOrder = await db.insert(orders).values({
      userId: auth.userId,
      buyerName,
      buyerEmail: user[0]?.email || "",
      buyerPhone,
      buyerAddress,
      product,
      quantity: quantity || 1,
      totalPrice,
      status: "pending",
      notes: notes || "",
    }).returning();

    await db.insert(notifications).values({
      recipientEmail: "earlrey0322@gmail.com",
      subject: `New Order - ${product}`,
      message: `${buyerName} ordered ${product} (₱${totalPrice}). Pay via GCash: 09469086926`,
      type: "order",
    });

    return NextResponse.json({ success: true, order: newOrder[0] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: "ID and status required" }, { status: 400 });

    await db.update(orders).set({ status }).where(eq(orders.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
