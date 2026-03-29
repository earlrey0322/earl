import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getAuthUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (auth.role === "company_owner") {
      // Company owner sees subscription revenue + all station revenue
      const allStations = store.getAllStations();
      const totalStationRevenue = allStations.reduce((s, st) => s + (st.revenue || 0), 0);
      const subscriptionRevenue = store.subscriptionRevenue;
      const allHistory = store.getAllHistory();
      return NextResponse.json({
        subscriptionRevenue,
        totalStationRevenue,
        totalRevenue: subscriptionRevenue + totalStationRevenue,
        totalSessions: allHistory.length,
        totalVisits: allStations.reduce((s, st) => s + st.totalVisits, 0),
        stationBreakdown: allStations.map((s) => ({
          id: s.id, name: s.name, companyName: s.companyName,
          revenue: s.revenue || 0, visits: s.totalVisits, isActive: s.isActive,
        })),
      });
    }

    if (auth.role === "branch_owner") {
      // Branch owner sees their station revenue
      const myStations = store.getAllStations().filter((s) => s.ownerId === auth.userId);
      const totalRevenue = myStations.reduce((s, st) => s + (st.revenue || 0), 0);
      const myHistory = store.getHistoryByUser(auth.userId);
      return NextResponse.json({
        totalRevenue,
        totalSessions: myHistory.length,
        totalVisits: myStations.reduce((s, st) => s + st.totalVisits, 0),
        stations: myStations.map((s) => ({
          id: s.id, name: s.name, revenue: s.revenue || 0, visits: s.totalVisits, isActive: s.isActive,
        })),
      });
    }

    // Customer sees their spending
    const myHistory = store.getHistoryByUser(auth.userId);
    const totalSpent = myHistory.reduce((s, h) => s + h.costPesos, 0);
    return NextResponse.json({ totalSpent, totalSessions: myHistory.length });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
