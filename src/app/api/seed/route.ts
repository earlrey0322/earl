import { NextResponse } from "next/server";
import { db } from "@/db";
import { chargingStations } from "@/db/schema";

const SAMPLES = [
  { name: "PSPCS Station - SM Mall", company: "KLEOXM 111", lat: 14.5995, lng: 120.9842, addr: "SM Mall of Asia, Pasay City", active: true, battery: 85, visits: 142, rev: 710, tc: 2, ip: 1, uv: 1, out: 2 },
  { name: "PSPCS Station - BGC", company: "KLEOXM 111", lat: 14.5537, lng: 121.0509, addr: "BGC High Street, Taguig City", active: true, battery: 92, visits: 89, rev: 445, tc: 1, ip: 2, uv: 1, out: 1 },
  { name: "PSPCS Station - Quiapo", company: "KLEOXM 111", lat: 14.5981, lng: 120.9837, addr: "Quiapo Church Area, Manila", active: false, battery: 15, visits: 234, rev: 1170, tc: 2, ip: 1, uv: 2, out: 3 },
  { name: "PSPCS Station - Cubao", company: "KLEOXM 111", lat: 14.6188, lng: 121.0509, addr: "Gateway Mall, Cubao, QC", active: true, battery: 78, visits: 67, rev: 335, tc: 1, ip: 1, uv: 1, out: 1 },
  { name: "PSPCS Station - Makati", company: "KLEOXM 111", lat: 14.5547, lng: 121.0244, addr: "Ayala Center, Makati City", active: true, battery: 95, visits: 198, rev: 990, tc: 2, ip: 2, uv: 1, out: 2 },
  { name: "SolarCharge - Ortigas", company: "SolarCharge Co.", lat: 14.5866, lng: 121.0635, addr: "SM Megamall, Ortigas Center", active: true, battery: 70, visits: 56, rev: 280, tc: 1, ip: 1, uv: 2, out: 1 },
  { name: "EcoCharge - Alabang", company: "EcoCharge Inc.", lat: 14.4198, lng: 121.0311, addr: "Festival Mall, Alabang", active: true, battery: 88, visits: 45, rev: 225, tc: 2, ip: 1, uv: 1, out: 2 },
];

export async function POST() {
  try {
    for (const s of SAMPLES) {
      await db.insert(chargingStations).values({
        name: s.name, companyName: s.company, brand: "PSPCS", latitude: s.lat, longitude: s.lng,
        address: s.addr, isActive: s.active, batteryLevel: s.battery, totalVisits: s.visits,
        revenue: s.rev, cableTypeC: s.tc, cableIPhone: s.ip, cableUniversal: s.uv, outlets: s.out,
      });
    }
    return NextResponse.json({ success: true, message: "Sample data loaded!" });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
