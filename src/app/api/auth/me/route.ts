import { NextResponse } from "next/server";
import { getDb } from "@/lib/database";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(auth.id) as any;
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      phoneBrand: user.phone_brand,
      contactNumber: user.contact_number,
      address: user.address,
      isSubscribed: !!user.is_subscribed,
      subPlan: user.subscription_plan,
      subExpiry: null,
    },
  });
}

export async function PATCH(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(auth.id) as any;
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: string[] = [];
  const values: any[] = [];

  if (body.fullName) { updates.push("full_name = ?"); values.push(body.fullName); }
  if (body.email) { updates.push("email = ?"); values.push(body.email); }
  if (body.contactNumber !== undefined) { updates.push("contact_number = ?"); values.push(body.contactNumber); }
  if (body.address !== undefined) { updates.push("address = ?"); values.push(body.address); }
  if (body.phoneBrand !== undefined) { updates.push("phone_brand = ?"); values.push(body.phoneBrand); }

  if (updates.length > 0) {
    values.push(auth.id);
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  db.prepare("DELETE FROM charging_stations WHERE owner_id = ?").run(auth.id);
  db.prepare("DELETE FROM users WHERE id = ?").run(auth.id);

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", "", { maxAge: 0, path: "/" });
  return res;
}
