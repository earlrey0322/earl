import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, notifications, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

const PRODUCTS = [
  { id: "pspcs-basic", name: "PSPCS Charging Station", price: 25000, desc: "Solar powered, 3.6VDC output, charges all phone types" },
  { id: "pspcs-2unit", name: "PSPCS Station (2 Units)", price: 48000, desc: "Two PSPCS stations bundle" },
  { id: "pspcs-3unit", name: "PSPCS Station (3 Units)", price: 70000, desc: "Three PSPCS stations bundle" },
];

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userResult = await db.select({ role: users.role }).from(users).where(eq(users.id, auth.userId));
    const role = userResult[0]?.role;

    let allOrders: typeof orders.$inferSelect[] = [];
    try {
      allOrders = role === "company_owner"
        ? await db.select().from(orders).orderBy(desc(orders.createdAt))
        : await db.select().from(orders).where(eq(orders.userId, auth.userId)).orderBy(desc(orders.createdAt));
    } catch {
      // Table might not exist yet
      allOrders = [];
    }

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
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const userResult = await db.select({ email: users.email }).from(users).where(eq(users.id, auth.userId));

    try {
      const newOrder = await db.insert(orders).values({
        userId: auth.userId,
        buyerName,
        buyerEmail: userResult[0]?.email || "",
        buyerPhone,
        buyerAddress,
        product,
        quantity: quantity || 1,
        totalPrice,
        status: "pending",
        notes: notes || "",
      }).returning();

      try {
        await db.insert(notifications).values({
          recipientEmail: "earlrey0322@gmail.com",
          subject: `New Order - ${product}`,
          message: `${buyerName} ordered ${product} (₱${totalPrice}). GCash: 09469086926`,
          type: "order",
        });
      } catch {}

      return NextResponse.json({ success: true, order: newOrder[0] });
    } catch (dbError) {
      // Table might not exist
      return NextResponse.json({ error: "Database error: " + String(dbError) }, { status: 500 });
    }
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
