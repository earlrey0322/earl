import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const notifs = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
    return NextResponse.json({ notifications: notifs });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
