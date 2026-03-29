import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function getAuthUser() {
  try {
    const c = await cookies();
    const token = c.get("token")?.value;
    if (!token) return null;
    return JSON.parse(atob(token)) as { id: number; email: string; role: string };
  } catch { return null; }
}
