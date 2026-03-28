import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user email to find their notifications
    const user = await db
      .select({ email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, auth.userId));

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Company owners see all notifications addressed to them
    // Others see their own notifications
    let notifs;
    if (user[0].role === "company_owner") {
      notifs = await db
        .select()
        .from(notifications)
        .where(eq(notifications.recipientEmail, "earlrey0322@gmail.com"));
    } else {
      notifs = await db
        .select()
        .from(notifications)
        .where(eq(notifications.recipientEmail, user[0].email));
    }

    return NextResponse.json({ notifications: notifs });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
