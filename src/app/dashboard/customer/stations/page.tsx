"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap, Station } from "@/components/StationMap";
import { ChargingCalculator } from "@/components/ChargingCalculator";
import { apiFetch } from "@/lib/api-fetch";

interface HistoryItem {
  id: number;
  phoneBrand: string;
  startBattery: number;
  targetBattery: number;
  costPesos: number;
  durationMinutes: number;
  stationName: string;
  userEmail: string;
  createdAt: string;
}

interface UserData {
  isSubscribed: boolean;
}

export default function StationsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/sessions").then((r) => r.json()),
    ]).then(([meRes, stRes, hRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) setUserData(meRes.value.user);
      if (stRes.status === "fulfilled" && stRes.value.stations) setStations(stRes.value.stations);
      if (hRes.status === "fulfilled" && hRes.value.history) setHistory(hRes.value.history);
    }).catch(() => {});
  }, []);

  async function handleStartSession(data: {
    stationId: number;
    phoneBrand: string;
    startBattery: number;
    targetBattery: number;
    costPesos: number;
    durationMinutes: number;
  }) {
    try {
      const res = await apiFetch("/api/sessions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setHistory((prev) => [result.history, ...prev]);
        alert(
          `Charging started!\n${data.phoneBrand}: ${data.startBattery}% → ${data.targetBattery}%\nCost: ₱${data.costPesos} | ${data.durationMinutes} min\n\nDrop ₱${data.costPesos} in the PSPCS unit.`
        );
      }
    } catch {
      alert("Error");
    }
  }

  return (
    <DashboardShell title="Stations">
      <div className="space-y-8">
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 to-orange-500/5">
          <h2 className="text-2xl font-bold text-white">Charging Stations</h2>
          <p className="text-slate-400 mt-1">
            Find a station, select it, and start charging.
          </p>
          <div className="flex gap-4 mt-4">
            <div className="px-4 py-2 bg-amber-400/10 rounded-lg">
              <div className="text-lg font-bold text-amber-400">{stations.length}</div>
              <div className="text-xs text-slate-400">Stations</div>
            </div>
            <div className="px-4 py-2 bg-green-400/10 rounded-lg">
              <div className="text-lg font-bold text-green-400">
                {stations.filter((s) => s.isActive).length}
              </div>
              <div className="text-xs text-slate-400">Active</div>
            </div>
          </div>
        </div>

        <section>
          <h3 className="text-lg font-bold text-white mb-4">Station Map</h3>
          <StationMap
            stations={stations}
            onSelect={setSelectedStation}
            selectedId={selectedStation?.id}
            showAllBrands={userData?.isSubscribed || false}
          />
        </section>

        <section id="sessions">
          <h3 className="text-lg font-bold text-white mb-4">Start Charging</h3>
          {selectedStation && (
            <p className="text-sm text-amber-400 mb-2">Selected: {selectedStation.name}</p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChargingCalculator
              stationId={selectedStation?.id}
              stationName={selectedStation?.name}
              onSessionStart={handleStartSession}
              history={history}
            />
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">PSPCS Info</h3>
              <div className="space-y-2 text-sm">
                {[
                  { l: "Rate", v: "1 Peso = 5 Min" },
                  { l: "Output", v: "3.6VDC" },
                  { l: "Cables", v: "All Types" },
                  { l: "Power", v: "Solar" },
                  { l: "AC", v: "220VAC" },
                  { l: "Brand", v: "KLEOXM 111" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="flex justify-between py-2 border-b border-slate-700/50"
                  >
                    <span className="text-slate-400">{s.l}</span>
                    <span className="text-amber-400 font-medium">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
