"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { RealMap } from "@/components/RealMap";
import { ChargingCalculator } from "@/components/ChargingCalculator";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { apiFetch } from "@/lib/api-fetch";

interface Station {
  id: number; name: string; companyName: string; brand: string; ownerId: number | null;
  latitude: number; longitude: number; address: string; isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits: number; revenue: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
  ownerName: string | null; contactNumber: string | null;
}

interface HistoryItem {
  id: number; phoneBrand: string; startBattery: number; targetBattery: number;
  costPesos: number; durationMinutes: number; stationName: string; userEmail: string; createdAt: string;
}

interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; contactNumber: string | null; }

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export default function BranchOwnerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newStation, setNewStation] = useState({
    name: "", address: "", latitude: 14.5995, longitude: 120.9842, contactNumber: "",
    cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1,
  });

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

  async function toggleStation(s: Station) {
    playClick();
    await apiFetch("/api/stations", { method: "PATCH", body: JSON.stringify({ id: s.id, isActive: !s.isActive }) });
    setStations((prev) => prev.map((st) => st.id === s.id ? { ...st, isActive: !st.isActive } : st));
  }

  async function addStation() {
    playClick();
    try {
      const res = await apiFetch("/api/stations", { method: "POST", body: JSON.stringify(newStation) });
      const data = await res.json();
      if (res.ok && data.station) {
        setStations((prev) => [...prev, data.station]);
        setShowAdd(false);
        setNewStation({ name: "", address: "", latitude: 14.5995, longitude: 120.9842, contactNumber: "", cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1 });
      } else {
        alert("Error: " + (data.error || "Failed to add station"));
      }
    } catch (err) { alert("Error: " + String(err)); }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setNewStation((p) => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
      () => alert("Could not get location")
    );
  }

  function handleRefresh() {
    apiFetch("/api/auth/me").then((r) => r.json()).then((d) => { if (d.user) setUserData(d.user); }).catch(() => {});
  }

  const myStations = stations.filter((s) => s.ownerId === userData?.id);
  const totalVisits = myStations.reduce((sum, s) => sum + s.totalVisits, 0);

  return (
    <DashboardShell title="Branch Owner Dashboard">
      <div className="space-y-8">
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-green-400/10 to-emerald-500/5">
          <h2 className="text-2xl font-bold text-white">Welcome, {userData?.fullName || "Station Owner"}!</h2>
          <p className="text-slate-400 mt-1">Manage your PSPCS stations.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="px-4 py-3 bg-green-400/10 rounded-lg"><div className="text-lg font-bold text-green-400">{myStations.length}</div><div className="text-xs text-slate-400">Your Stations</div></div>
            <div className="px-4 py-3 bg-amber-400/10 rounded-lg"><div className="text-lg font-bold text-amber-400">{myStations.filter((s) => s.isActive).length}</div><div className="text-xs text-slate-400">Active</div></div>
            <div className="px-4 py-3 bg-blue-400/10 rounded-lg"><div className="text-lg font-bold text-blue-400">{totalVisits}</div><div className="text-xs text-slate-400">Total Visits</div></div>
            <div className="px-4 py-3 bg-purple-400/10 rounded-lg"><div className="text-lg font-bold text-purple-400">{history.length}</div><div className="text-xs text-slate-400">Sessions</div></div>
          </div>
        </div>

        {/* Add Station */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Your Stations</h3>
          <button onClick={() => { playClick(); setShowAdd(!showAdd); }}
            className="px-4 py-2 text-sm font-medium text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
            + Add Station
          </button>
        </div>

        {showAdd && (
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Add New Station</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Name</label>
                <input type="text" value={newStation.name} onChange={(e) => setNewStation((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" placeholder="PSPCS Station - Marikina" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Exact Location / Address</label>
                <input type="text" value={newStation.address} onChange={(e) => setNewStation((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" placeholder="Full address" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Latitude</label>
                <input type="number" step="0.0001" value={newStation.latitude} onChange={(e) => setNewStation((p) => ({ ...p, latitude: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Longitude</label>
                <input type="number" step="0.0001" value={newStation.longitude} onChange={(e) => setNewStation((p) => ({ ...p, longitude: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" />
              </div>
              <div className="md:col-span-2">
                <button type="button" onClick={useCurrentLocation}
                  className="w-full py-3 text-sm font-medium text-green-400 border border-green-400/30 rounded-lg hover:bg-green-400/10">
                  Use My Current Location
                </button>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Type-C Cables</label>
                <input type="number" min={0} value={newStation.cableTypeC} onChange={(e) => setNewStation((p) => ({ ...p, cableTypeC: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">iPhone Cables</label>
                <input type="number" min={0} value={newStation.cableIPhone} onChange={(e) => setNewStation((p) => ({ ...p, cableIPhone: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Universal USB Cables</label>
                <input type="number" min={0} value={newStation.cableUniversal} onChange={(e) => setNewStation((p) => ({ ...p, cableUniversal: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Outlets</label>
                <input type="number" min={0} value={newStation.outlets} onChange={(e) => setNewStation((p) => ({ ...p, outlets: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Contact Number</label>
                <input type="tel" value={newStation.contactNumber} onChange={(e) => setNewStation((p) => ({ ...p, contactNumber: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" placeholder="09XXXXXXXXX" />
              </div>
              <div className="flex items-end gap-3">
                <button onClick={addStation} disabled={!newStation.name || !newStation.address}
                  className="flex-1 py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg disabled:opacity-50">Add Station</button>
                <button onClick={() => { playClick(); setShowAdd(false); }} className="px-4 py-3 text-sm text-slate-400 border border-slate-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* My Stations */}
        {myStations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myStations.map((s) => (
              <div key={s.id} className="glass-card rounded-xl p-4">
                <h4 className="font-bold text-white text-sm">{s.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{s.address}</p>
                <div className="flex gap-1.5 mt-2">
                  {s.cableTypeC > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">TC:{s.cableTypeC}</span>}
                  {s.cableIPhone > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">iP:{s.cableIPhone}</span>}
                  {s.cableUniversal > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded">USB:{s.cableUniversal}</span>}
                  {s.outlets > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">O:{s.outlets}</span>}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                  <span className="text-[10px] text-slate-500">{s.totalVisits} visits | {s.solarWatts}W</span>
                  <button onClick={() => toggleStation(s)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-full ${s.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <section id="stations">
          <h3 className="text-lg font-bold text-white mb-4">All PSPCS Stations</h3>
          <RealMap stations={stations} onSelect={(s) => setSelectedStation(s)} selectedId={selectedStation?.id} showAllBrands={userData?.isSubscribed || false} />
        </section>

        <section id="sessions">
          <h3 className="text-lg font-bold text-white mb-4">Charging Sessions</h3>
          {selectedStation && <p className="text-sm text-amber-400 mb-2">Selected: {selectedStation.name}</p>}
          <ChargingCalculator stationId={selectedStation?.id} stationName={selectedStation?.name}
            onSessionStart={async (data) => {
              const res = await apiFetch("/api/sessions", { method: "POST", body: JSON.stringify(data) });
              if (res.ok) { const r = await res.json(); setHistory((p) => [r.history, ...p]); alert(`Started! ₱${data.costPesos}`); }
            }} history={history} />
        </section>

        {/* Revenue */}
        <section id="revenue" className="space-y-4">
          <h3 className="text-lg font-bold text-white">Revenue</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-4"><div className="text-2xl font-bold text-green-400">₱{myStations.reduce((s, st) => s + (st.revenue || 0), 0)}</div><div className="text-xs text-slate-400">Station Revenue</div></div>
            <div className="glass-card rounded-xl p-4"><div className="text-2xl font-bold text-amber-400">{totalVisits}</div><div className="text-xs text-slate-400">Total Visits</div></div>
            <div className="glass-card rounded-xl p-4"><div className="text-2xl font-bold text-blue-400">{history.length}</div><div className="text-xs text-slate-400">Charging Sessions</div></div>
            <div className="glass-card rounded-xl p-4"><div className="text-2xl font-bold text-purple-400">{myStations.length}</div><div className="text-xs text-slate-400">Your Stations</div></div>
          </div>
          {myStations.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-bold text-white mb-4">Per Station Revenue</h4>
              <div className="space-y-3">
                {myStations.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.totalVisits} visits</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">₱{s.revenue || 0}</p>
                      <p className="text-[10px] text-slate-500">{s.isActive ? "Active" : "Inactive"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section id="subscription">
          <h3 className="text-lg font-bold text-white mb-4">Subscription</h3>
          <SubscriptionCard role="branch_owner" isSubscribed={userData?.isSubscribed || false} onSubscribe={handleRefresh} />
        </section>
      </div>
    </DashboardShell>
  );
}
