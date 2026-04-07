import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/api-auth";

const ITEMS = [
  { id: "full_station", name: "Full Charging Station", description: "Complete PSPCS solar-powered charging station", price: 21125, image: "https://assets.kiloapps.io/user_061af2b2-c2a5-4dde-be2d-578f8d4a3f18/f9f43215-05fa-484b-a516-be2eb8521f47/d0c16e01-147d-4146-b76d-cb1d5042efde.png", specs: ["Solar Panel w/ Rectifier Bridge Diode", "DC Output for Battery Charging", "Inverter: Battery to 220VAC", "Converter: Transformer to 12VAC", "Rectifier: 12VAC to DC", "Final Output: 3.6VDC Rotary", "All Device Types Compatible", "Brand: KLEOXM 111 PSPCS"] },
];

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    // Get store orders
    let query = supabase.from("store_orders").select("*").order("created_at", { ascending: false });
    
    if (auth.role !== "company_owner") {
      query = query.eq("user_id", auth.id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message });

    return NextResponse.json({ items: ITEMS, orders: data || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });

    const body = await req.json();
    const { itemId, fullName, contactNumber, deliveryAddress, referenceNumber } = body;

    if (!itemId || !fullName || !contactNumber || !deliveryAddress || !referenceNumber) {
      return NextResponse.json({ error: "All fields required" });
    }

    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return NextResponse.json({ error: "Invalid item" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const { data, error } = await supabase.from("store_orders").insert({
      user_id: auth.id,
      user_email: auth.email,
      item_id: itemId,
      item_name: item.name,
      amount: item.price,
      full_name: fullName,
      contact_number: contactNumber,
      delivery_address: deliveryAddress,
      reference_number: referenceNumber,
      status: "pending",
    }).select();

    if (error) return NextResponse.json({ error: error.message });

    // Notify company owner
    await supabase.from("notifications").insert({
      recipient_email: "earlrey0322@gmail.com",
      subject: `Store Order - ${item.name}`,
      message: `${fullName} ordered ${item.name} (₱${item.price}). Ref: ${referenceNumber}. Contact: ${contactNumber}`,
      type: "store_order",
    });

    return NextResponse.json({ success: true, order: data?.[0] });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" });
    if (auth.role !== "company_owner") return NextResponse.json({ error: "Only company owner can update" });

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) return NextResponse.json({ error: "orderId and status required" });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database not set up" });

    const { data: order, error: fetchError } = await supabase
      .from("store_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) return NextResponse.json({ error: "Order not found" });

    await supabase.from("store_orders").update({ status, reviewed_at: new Date().toISOString() }).eq("id", orderId);

    // Notify user
    await supabase.from("notifications").insert({
      recipient_email: order.user_email,
      subject: `Store Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your order for ${order.item_name} (₱${order.amount}) has been ${status}.`,
      type: `store_order_${status}`,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
