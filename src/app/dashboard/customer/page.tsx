"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap, Station } from "@/components/StationMap";
import { ChargingCalculator } from "@/components/ChargingCalculator";
import { apiFetch } from "@/lib/api-fetch";

interface HistoryItem {
  id: number; phoneBrand: string; startBattery: number; targetBattery: number;
  costPesos: number; durationMinutes: number; stationName: string; userEmail: string; createdAt: string;
}

interface SubscriptionRequest { id: number; plan: string; status: string; created_at: string; reference_number: string; }
interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; subscriptionExpiry: string | null; subscriptionPlan: string | null; }

const PLANS = [
  { id: "1_day", label: "1 Day", days: 1, price: 25 },
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

  // Handle station selection
  function handleSelectStation(station: Station) {
    setSelectedStation(station);
  }

  useEffect(() => {
    const fetchStations = async (lat?: number, lon?: number) => {
      const url = lat && lon ? `/api/stations?lat=${lat}&lon=${lon}` : "/api/stations";
      const res = await apiFetch(url);
      const data = await res.json();
      if (data.stations) setStations(data.stations);
    };

    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      navigator.geolocation
        ? new Promise<{ coords: { latitude: number; longitude: number } }>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          ).then((pos) => fetchStations(pos.coords.latitude, pos.coords.longitude)).catch(() => fetchStations())
        : fetchStations(),
      apiFetch("/api/sessions").then((r) => r.json()),
      apiFetch("/api/subscription-requests").then((r) => r.json()),
    ]).then(([meRes, , hRes, srRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) setUserData(meRes.value.user);
      if (hRes.status === "fulfilled" && hRes.value.history) setHistory(hRes.value.history);
      if (srRes.status === "fulfilled" && srRes.value.requests) setSubRequests(srRes.value.requests);
    }).catch(() => {});
  }, []);

  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const expiryRef = useRef<string | null>(null);

  useEffect(() => {
    expiryRef.current = userData?.subscriptionExpiry || null;
  }, [userData?.subscriptionExpiry]);

  // Subscription timer with seconds
  useEffect(() => {
    const updateCountdown = () => {
      const expiry = expiryRef.current;
      if (!expiry) {
        setTimeLeft(null);
        return;
      }
      const exp = new Date(expiry).getTime();
      const now = Date.now();
      const diff = exp - now;
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

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
        // Refresh subscription requests
        try {
          const refreshRes = await apiFetch("/api/subscription-requests");
          const refreshData = await refreshRes.json();
          if (refreshData.requests) setSubRequests(refreshData.requests);
        } catch (refreshErr) {
          console.error("Error refreshing requests:", refreshErr);
        }
      } else {
        alert("Error: " + (data.error || "Failed to send request"));
      }
    } catch (err) { 
      console.error("Error sending subscription request:", err);
      alert("Error sending request: " + String(err)); 
    }
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
          <StationMap stations={stations} onSelect={handleSelectStation} selectedId={selectedStation?.id} isPremium={userData?.isSubscribed || false} />
        </section>

        <section id="sessions">
          <h3 className="text-lg font-bold text-white mb-4">PSPCS-based Calculator</h3>
          {selectedStation && <p className="text-sm text-amber-400 mb-2">Selected: {selectedStation.name}</p>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChargingCalculator stationId={selectedStation?.id} stationName={selectedStation?.name} companyName={selectedStation?.companyName} onSessionStart={handleStartSession} history={history} />
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">PSPCS Info</h3>
              <div className="space-y-2 text-sm">
                {[{ l: "Output", v: "3.6VDC" }, { l: "Cables", v: "All Types" }, { l: "Power", v: "Solar" }, { l: "AC", v: "220VAC" }, { l: "Brand", v: "KLEOXM 111" }].map((s) => (
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
                    <h4 className="font-bold text-white">★ PREMIUM Active</h4>
                    <p className="text-sm text-amber-400">
                      {userData?.subscriptionPlan ? userData.subscriptionPlan.replace(/_/g, " ").toUpperCase() : "MONTHLY"}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-amber-400 text-[#0f172a] text-xs font-bold rounded-full">★ PREMIUM</div>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Time Remaining</p>
                  <p className="text-2xl font-bold font-mono text-amber-400">{timeLeft}</p>
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

        {/* Account Status */}
        <section className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white">Account Status</h4>
              <p className="text-sm text-slate-400">
                {userData?.isSubscribed ? "You can see all stations nearby" : "Nearby stations hidden — subscribe to see them"}
              </p>
            </div>
            {userData?.isSubscribed ? (
              <div className="px-4 py-2 bg-amber-400/10 rounded-lg">
                <span className="text-amber-400 font-bold">★ PREMIUM</span>
                {userData?.subscriptionExpiry && (
                  <p className="text-[10px] text-slate-400 mt-1">Expires: {new Date(userData.subscriptionExpiry).toLocaleDateString()}</p>
                )}
              </div>
            ) : (
              <div className="px-4 py-2 bg-slate-700 rounded-lg">
                <span className="text-slate-400 font-bold">Regular</span>
              </div>
            )}
          </div>
          {!userData?.isSubscribed && (
            <div className="mt-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
              <p className="text-xs text-amber-400">🔒 Premium members can view all company stations. Subscribe to unlock!</p>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
