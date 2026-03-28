import { NextResponse } from "next/server";
import { db } from "@/db";
import { chargingStations } from "@/db/schema";
import { SAMPLE_STATIONS } from "@/lib/sample-data";

export async function POST() {
  try {
    const existing = await db.select().from(chargingStations);
    if (existing.length > 0) {
      return NextResponse.json({
        message: "Sample data already exists",
        count: existing.length,
      });
    }

    for (const station of SAMPLE_STATIONS) {
      await db.insert(chargingStations).values({
        name: station.name,
        brand: station.brand,
        ownerId: null,
        ownerName: station.name.includes("PSPCS") ? "KLEOXM 111" : "Third Party",
        latitude: station.latitude,
        longitude: station.longitude,
        address: station.address,
        contactNumber: station.contactNumber,
        isActive: station.isActive,
        solarWatts: station.solarWatts,
        batteryLevel: station.batteryLevel,
        outputVoltage: "3.6VDC",
        totalSessions: station.totalSessions,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Sample data seeded successfully",
      count: SAMPLE_STATIONS.length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
