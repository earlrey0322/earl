"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap } from "@/components/StationMap";
import { ChargingCalculator } from "@/components/ChargingCalculator";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { apiFetch } from "@/lib/api-fetch";

interface Station {
  id: number; name: string; companyName: string; brand: string; ownerId: number | null;
  latitude: number; longitude: number; address: string; isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
  ownerName: string | null; contactNumber: string | null;
}

interface HistoryItem {
  id: number; phoneBrand: string; startBattery: number; targetBattery: number;
  costPesos: number; durationMinutes: number; stationName: string; createdAt: string;
}

interface UserData {
  id: number; email: string; fullName: string; role: string; isSubscribed: boolean;
}

export default function CustomerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/sessions").then((r) => r.json()),
    ]).then(([meRes, stationsRes, histRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) setUserData(meRes.value.user);
      if (stationsRes.status === "fulfilled" && stationsRes.value.stations) setStations(stationsRes.value.stations);
      if (histRes.status === "fulfilled" && histRes.value.history) setHistory(histRes.value.history);
    }).catch(() => setError("Failed to load data"));
  }, []);

  async function handleStartSession(data: { stationId: number; phoneBrand: string; startBattery: number; targetBattery: number; costPesos: number; durationMinutes: number }) {
    try {
      const res = await apiFetch("/api/sessions", { method: "POST", body: JSON.stringify(data) });
      if (res.ok) {
        const result = await res.json();
        setHistory((prev) => [result.history, ...prev]);
        alert(`Charging started!\n${data.phoneBrand}: ${data.startBattery}% → ${data.targetBattery}%\nCost: ₱${data.costPesos} | ${data.durationMinutes} min`);
      }
    } catch { alert("Error starting session"); }
  }

  function handleRefresh() {
    apiFetch("/api/auth/me").then((r) => r.json()).then((d) => { if (d.user) setUserData(d.user); }).catch(() => {});
  }

  return (
    <DashboardShell title="Customer Dashboard">
      <div className="space-y-6">
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}

        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 to-orange-500/5">
          <h2 className="text-2xl font-bold text-white">Welcome, {userData?.fullName || "Customer"}!</h2>
          <p className="text-slate-400 mt-1">Find PSPCS stations, calculate cost, and start charging.</p>
          <div className="flex gap-4 mt-4">
            <div className="px-4 py-2 bg-amber-400/10 rounded-lg"><div className="text-lg font-bold text-amber-400">{stations.length}</div><div className="text-xs text-slate-400">Stations</div></div>
            <div className="px-4 py-2 bg-green-400/10 rounded-lg"><div className="text-lg font-bold text-green-400">{stations.filter((s) => s.isActive).length}</div><div className="text-xs text-slate-400">Active</div></div>
            <div className="px-4 py-2 bg-blue-400/10 rounded-lg"><div className="text-lg font-bold text-blue-400">{history.length}</div><div className="text-xs text-slate-400">Sessions</div></div>
          </div>
        </div>

        <section id="stations">
          <h3 className="text-lg font-bold text-white mb-4">Charging Stations</h3>
          <StationMap stations={stations} onSelect={(s) => setSelectedStation(s)} selectedId={selectedStation?.id} showAllBrands={userData?.isSubscribed || false} />
        </section>

        <section id="sessions" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChargingCalculator stationId={selectedStation?.id} onSessionStart={handleStartSession} />
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Charging History</h3>
            {history.length === 0 ? (
              <div className="text-center py-8"><div className="text-4xl mb-2">🔋</div><p className="text-sm text-slate-400">No sessions yet</p></div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{h.phoneBrand}</p>
                      <p className="text-xs text-slate-400">{h.stationName}</p>
                      <p className="text-xs text-slate-500">{h.startBattery}% → {h.targetBattery}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-400">₱{h.costPesos}</p>
                      <p className="text-xs text-slate-500">{h.durationMinutes} min</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="subscription">
          <h3 className="text-lg font-bold text-white mb-4">Subscription</h3>
          <div className="max-w-md">
            <SubscriptionCard role="customer" isSubscribed={userData?.isSubscribed || false} onSubscribe={handleRefresh} />
          </div>
        </section>

        <section className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">PSPCS Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { l: "Rate", v: "1 Peso = 5 Min" }, { l: "Output", v: "3.6VDC" }, { l: "Cables", v: "All Types" },
              { l: "Power", v: "Solar Panel" }, { l: "AC", v: "220VAC" }, { l: "Brand", v: "KLEOXM 111" },
            ].map((s) => (
              <div key={s.l} className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">{s.l}</span><span className="text-amber-400 font-medium">{s.v}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
