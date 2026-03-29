import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const SAMPLE_STATIONS = [
  { name: "PSPCS - SM Mall", company_name: "KLEOXM 111", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5995, longitude: 120.9842, address: "SM Mall of Asia, Pasay", location: "Pasay City", is_active: true, battery_level: 85, total_visits: 142, cable_type_c: 2, cable_iphone: 1, cable_universal: 1, outlets: 2 },
  { name: "PSPCS - BGC", company_name: "KLEOXM 111", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5537, longitude: 121.0509, address: "BGC High Street, Taguig", location: "Taguig City", is_active: true, battery_level: 92, total_visits: 89, cable_type_c: 1, cable_iphone: 2, cable_universal: 1, outlets: 1 },
  { name: "PSPCS - Quiapo", company_name: "KLEOXM 111", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5981, longitude: 120.9837, address: "Quiapo Church, Manila", location: "Manila", is_active: false, battery_level: 15, total_visits: 234, cable_type_c: 2, cable_iphone: 1, cable_universal: 2, outlets: 3 },
  { name: "PSPCS - Cubao", company_name: "KLEOXM 111", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.6188, longitude: 121.0509, address: "Gateway Mall, Cubao", location: "Quezon City", is_active: true, battery_level: 78, total_visits: 67, cable_type_c: 1, cable_iphone: 1, cable_universal: 1, outlets: 1 },
  { name: "PSPCS - Makati", company_name: "KLEOXM 111", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5547, longitude: 121.0244, address: "Ayala Center, Makati", location: "Makati City", is_active: true, battery_level: 95, total_visits: 198, cable_type_c: 2, cable_iphone: 2, cable_universal: 1, outlets: 2 },
];

export async function POST() {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "No Supabase config" });

    // Check if tables exist
    const { error: checkError } = await supabase.from("charging_stations").select("id").limit(1);
    
    if (checkError && (checkError.message.includes("Could not find the table") || checkError.message.includes("relation"))) {
      return NextResponse.json({ 
        error: "Tables not created. Run SQL schema first.",
        setupRequired: true
      });
    }

    // Check if sample data exists
    const { data: existing } = await supabase.from("charging_stations").select("id").limit(1);
    
    if (!existing || existing.length === 0) {
      const { error: insertError } = await supabase.from("charging_stations").insert(SAMPLE_STATIONS);
      if (insertError) return NextResponse.json({ error: "Insert failed: " + insertError.message });
    }

    return NextResponse.json({ success: true, message: "Database ready!" });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
