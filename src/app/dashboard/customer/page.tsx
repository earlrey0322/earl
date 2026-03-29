"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap } from "@/components/StationMap";
import { ChargingCalculator } from "@/components/ChargingCalculator";
import { apiFetch } from "@/lib/api-fetch";

interface Station {
  id: number; name: string; companyName: string; brand: string; ownerId: number | null;
  latitude: number; longitude: number; address: string; isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits: number; revenue?: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
  ownerName: string | null;
}

interface HistoryItem {
  id: number; phoneBrand: string; startBattery: number; targetBattery: number;
  costPesos: number; durationMinutes: number; stationName: string; userEmail: string; createdAt: string;
}

interface SubscriptionRequest { id: number; plan: string; status: string; created_at: string; reference_number: string; }
interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; subscriptionExpiry: string | null; }

const PLANS = [
  { id: "1_day", label: "1 Day", days: 1, price: 20 },
  { id: "1_week", label: "1 Week", days: 7, price: 60 },
  { id: "1_month", label: "1 Month", days: 30, price: 100 },
  { id: "3_months", label: "3 Months", days: 90, price: 170 },
  { id: "6_months", label: "6 Months", days: 180, price: 220 },
  { id: "1_year", label: "1 Year", days: 365, price: 300 },
];

export default function CustomerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

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

  // Subscription timer
  useEffect(() => {
    if (!userData?.isSubscribed || !userData?.subscriptionExpiry) {
      return;
    }
    const updateTimer = () => {
      const expiry = new Date(userData.subscriptionExpiry!).getTime();
      const now = Date.now();
      const diff = expiry - now;
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
      else setTimeLeft(`${minutes}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [userData?.isSubscribed, userData?.subscriptionExpiry]);

  async function requestSubscription() {
    if (!selectedPlan || !referenceNumber.trim()) {
      alert("Please select a plan and enter your GCash reference number");
      return;
    }
    setRequesting(true);
    try {
      const res = await apiFetch("/api/subscription-requests", { method: "POST", body: JSON.stringify({ plan: selectedPlan, referenceNumber: referenceNumber.trim() }) });
      const data = await res.json();
      if (res.ok) {
        alert("Subscription request sent! Waiting for company owner approval.");
        setSelectedPlan(null);
        setReferenceNumber("");
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
            {userData?.isSubscribed && timeLeft ? (
              <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/20 to-orange-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-white">Premium Active</h4>
                    <p className="text-sm text-slate-400">Full access to all features</p>
                  </div>
                  <div className="px-3 py-1 bg-amber-400 text-[#0f172a] text-xs font-bold rounded-full">★ PREMIUM</div>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Time Remaining</p>
                  <p className="text-2xl font-bold text-amber-400">{timeLeft}</p>
                  <p className="text-xs text-slate-500 mt-1">Expires: {userData?.subscriptionExpiry ? new Date(userData.subscriptionExpiry).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>
            ) : !userData?.isSubscribed ? (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-white">Request Premium Access</h4>
                    <p className="text-sm text-slate-400">Select a plan and send request</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-full">Free Plan</span>
                </div>
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
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                      <p className="text-xs text-blue-400 mb-2">GCash Payment</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Number</span><span className="text-white font-bold">09469086926</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-white">Earl Christian Rey</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-amber-400 font-bold">₱{PLANS.find((p) => p.id === selectedPlan)?.price}</span></div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-2">GCash Reference Number</label>
                      <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Enter reference number from GCash"
                        className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
                    </div>

                    <button onClick={requestSubscription} disabled={requesting || !referenceNumber.trim()}
                      className="w-full py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg disabled:opacity-50">
                      {requesting ? "Sending..." : "Request Premium"}
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {subRequests.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h4 className="font-bold text-white mb-4">Your Requests</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {subRequests.map((req) => (
                    <div key={req.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{req.plan.replace(/_/g, " ")}</p>
                          <p className="text-xs text-slate-400">Ref: {req.reference_number || "N/A"}</p>
                          <p className="text-xs text-slate-500">{new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${req.status === "approved" ? "bg-green-400/10 text-green-400" : req.status === "rejected" ? "bg-red-400/10 text-red-400" : "bg-amber-400/10 text-amber-400"}`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </div>
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
