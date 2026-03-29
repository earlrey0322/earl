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
  solarWatts: number; batteryLevel: number; totalVisits: number; revenue?: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
  ownerName: string | null; contactNumber: string | null;
}

interface HistoryItem {
  id: number; phoneBrand: string; startBattery: number; targetBattery: number;
  costPesos: number; durationMinutes: number; stationName: string; userEmail: string; createdAt: string;
}

interface SubscriptionRequest { id: number; plan: string; status: string; created_at: string; }
interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; }

const PLANS = [
  { id: "1_day", label: "1 Day", days: 1, price: 15 },
  { id: "1_week", label: "1 Week", days: 7, price: 50 },
  { id: "1_month", label: "1 Month", days: 30, price: 120 },
  { id: "1_year", label: "1 Year", days: 365, price: 300 },
];

export default function CustomerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/sessions").then((r) => r.json()),
      apiFetch("/api/subscription-requests").then((r) => r.json()),
    ]).then(([meRes, stRes, hRes, srRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) setUserData(meRes.value.user);
      if (stRes.status === "fulfilled" && stRes.value.stations) setStations(stRes.value.stations);
      if (hRes.status === "fulfilled" && hRes.value.history) setHistory(hRes.value.history);
      if (srRes.status === "fulfilled" && srRes.value.requests) setSubRequests(srRes.value.requests);
    }).catch(() => {});
  }, []);

  async function requestSubscription() {
    if (!selectedPlan) return;
    setRequesting(true);
    try {
      const res = await apiFetch("/api/subscription-requests", { method: "POST", body: JSON.stringify({ plan: selectedPlan }) });
      const data = await res.json();
      if (res.ok) {
        alert("Subscription request sent! Waiting for company owner approval.");
        setSelectedPlan(null);
        apiFetch("/api/subscription-requests").then((r) => r.json()).then((d) => { if (d.requests) setSubRequests(d.requests); }).catch(() => {});
      } else {
        alert("Error: " + (data.error || "Failed to send request"));
      }
    } catch { alert("Error sending request"); }
    setRequesting(false);
  }

  async function handleStartSession(data: { stationId: number; phoneBrand: string; startBattery: number; targetBattery: number; costPesos: number; durationMinutes: number }) {
    try {
      const res = await apiFetch("/api/sessions", { method: "POST", body: JSON.stringify(data) });
      if (res.ok) {
        const result = await res.json();
        setHistory((prev) => [result.history, ...prev]);
        alert(`Charging started!\n${data.phoneBrand}: ${data.startBattery}% → ${data.targetBattery}%\nCost: ₱${data.costPesos} | ${data.durationMinutes} min\n\nDrop ₱${data.costPesos} in the PSPCS unit.`);
      }
    } catch { alert("Error"); }
  }

  function handleRefresh() {
    apiFetch("/api/auth/me").then((r) => r.json()).then((d) => { if (d.user) setUserData(d.user); }).catch(() => {});
  }

  return (
    <DashboardShell title="Customer Dashboard">
      <div className="space-y-8">
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 to-orange-500/5">
          <h2 className="text-2xl font-bold text-white">Welcome, {userData?.fullName || "Customer"}!</h2>
          <p className="text-slate-400 mt-1">Find stations, calculate cost, and start charging.</p>
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

        <section id="sessions">
          <h3 className="text-lg font-bold text-white mb-4">Charging Sessions</h3>
          {selectedStation && <p className="text-sm text-amber-400 mb-2">Selected: {selectedStation.name}</p>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChargingCalculator stationId={selectedStation?.id} stationName={selectedStation?.name} onSessionStart={handleStartSession} history={history} />
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">PSPCS Info</h3>
              <div className="space-y-2 text-sm">
                {[{ l: "Rate", v: "1 Peso = 5 Min" }, { l: "Output", v: "3.6VDC" }, { l: "Cables", v: "All Types" }, { l: "Power", v: "Solar" }, { l: "AC", v: "220VAC" }, { l: "Brand", v: "KLEOXM 111" }].map((s) => (
                  <div key={s.l} className="flex justify-between py-2 border-b border-slate-700/50"><span className="text-slate-400">{s.l}</span><span className="text-amber-400 font-medium">{s.v}</span></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="subscription">
          <h3 className="text-lg font-bold text-white mb-4">Subscription</h3>
          <div className="max-w-md space-y-6">
            <SubscriptionCard role="customer" isSubscribed={userData?.isSubscribed || false} onSubscribe={handleRefresh} />

            {!userData?.isSubscribed && (
              <div className="glass-card rounded-2xl p-6">
                <h4 className="font-bold text-white mb-4">Request Subscription</h4>
                <p className="text-sm text-slate-400 mb-4">Select a plan and request approval from company owner.</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PLANS.map((plan) => (
                    <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${selectedPlan === plan.id ? "border-amber-400 bg-amber-400/10" : "border-slate-600 hover:border-slate-500"}`}>
                      <div className="text-sm font-bold text-white">{plan.label}</div>
                      <div className="text-lg font-bold text-amber-400">₱{plan.price}</div>
                    </button>
                  ))}
                </div>
                {selectedPlan && (
                  <button onClick={requestSubscription} disabled={requesting}
                    className="w-full py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg disabled:opacity-50">
                    {requesting ? "Sending..." : `Request ${PLANS.find((p) => p.id === selectedPlan)?.label} Plan`}
                  </button>
                )}
              </div>
            )}

            {subRequests.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h4 className="font-bold text-white mb-4">Your Requests</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {subRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{req.plan.replace("_", " ")}</p>
                        <p className="text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${req.status === "approved" ? "bg-green-400/10 text-green-400" : req.status === "rejected" ? "bg-red-400/10 text-red-400" : "bg-amber-400/10 text-amber-400"}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
