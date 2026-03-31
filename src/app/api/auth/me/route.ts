import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const { data: user, error } = await supabase.from("users").select("*").eq("id", auth.id).single();
    if (error || !user) return NextResponse.json({ error: "User not found" });

    // Check if subscription has expired
    let isSubscribed = user.is_subscribed || false;
    if (isSubscribed && user.subscription_expiry) {
      const expiry = new Date(user.subscription_expiry).getTime();
      if (expiry < Date.now()) {
        // Subscription expired - update user
        isSubscribed = false;
        await supabase
          .from("users")
          .update({ is_subscribed: false })
          .eq("id", user.id);
      }
    }

    return NextResponse.json({
      user: {
        id: user.id, email: user.email, fullName: user.full_name, role: user.role,
        phoneBrand: user.phone_brand, contactNumber: user.contact_number, address: user.address,
        isSubscribed, subscriptionPlan: user.subscription_plan,
        subscriptionExpiry: user.subscription_expiry,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const body = await req.json();
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const data: any = {};
    if (body.fullName) data.full_name = body.fullName;
    if (body.email) data.email = body.email;
    if (body.contactNumber !== undefined) data.contact_number = body.contactNumber;
    if (body.address !== undefined) data.address = body.address;
    if (body.phoneBrand !== undefined) data.phone_brand = body.phoneBrand;

    await supabase.from("users").update(data).eq("id", auth.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

export async function DELETE() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    await supabase.from("charging_stations").delete().eq("owner_id", auth.id);
    await supabase.from("users").delete().eq("id", auth.id);

    const res = NextResponse.json({ success: true });
    res.cookies.set("token", "", { maxAge: 0, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
