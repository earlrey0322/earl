"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap, Station } from "@/components/StationMap";
import { apiFetch } from "@/lib/api-fetch";

interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; contactNumber: string | null; subscriptionExpiry: string | null; }

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export default function StationsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newStation, setNewStation] = useState({
    name: "", address: "", latitude: 14.5995, longitude: 120.9842,
    cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1,
  });
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [editForm, setEditForm] = useState({ name: "", address: "", active: true, cableTypeC: 0, cableIPhone: 0, cableUniversal: 0, outlets: 1 });

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
    ]).then(([meRes, stRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) {
        setUserData(meRes.value.user);
      }
      if (stRes.status === "fulfilled" && stRes.value.stations) {
        setStations(stRes.value.stations);
      }
    }).catch(() => {});
  }, []);

  const myStations = stations.filter((s) => Number(s.ownerId) === Number(userData?.id));
  const canAddStation = userData?.isSubscribed === true;

  function startEdit(s: Station) {
    playClick();
    setEditStation(s);
    setEditForm({ name: s.name, address: s.address, active: s.isActive, cableTypeC: s.cableTypeC, cableIPhone: s.cableIPhone, cableUniversal: s.cableUniversal, outlets: s.outlets });
  }

  async function saveEdit() {
    if (!editStation) return;
    playClick();
    await apiFetch("/api/stations", { method: "PATCH", body: JSON.stringify({ id: editStation.id, name: editForm.name, address: editForm.address, active: editForm.active, cableTypeC: editForm.cableTypeC, cableIPhone: editForm.cableIPhone, cableUniversal: editForm.cableUniversal, outlets: editForm.outlets }) });
    setStations((prev) => prev.map((s) => s.id === editStation.id ? { ...s, name: editForm.name, address: editForm.address, isActive: editForm.active, cableTypeC: editForm.cableTypeC, cableIPhone: editForm.cableIPhone, cableUniversal: editForm.cableUniversal, outlets: editForm.outlets } : s));
    setEditStation(null);
  }

  async function addStation() {
    playClick();
    try {
      const res = await apiFetch("/api/stations", { method: "POST", body: JSON.stringify(newStation) });
      const data = await res.json();
      if (res.ok && data.station) {
        setStations((prev) => [...prev, data.station]);
        setShowAdd(false);
        setNewStation({ name: "", address: "", latitude: 14.5995, longitude: 120.9842, cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1 });
      } else {
        alert("Error: " + (data.error || "Failed to add station"));
      }
    } catch (err) { alert("Error: " + String(err)); }
  }

  async function removeStation(id: number, name: string) {
    playClick();
    if (!confirm(`Remove "${name}"?`)) return;
    await apiFetch("/api/stations", { method: "DELETE", body: JSON.stringify({ id }) });
    setStations((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleStation(s: Station) {
    playClick();
    const newActive = !s.isActive;
    await apiFetch("/api/stations", { method: "PATCH", body: JSON.stringify({ id: s.id, active: newActive }) });
    setStations((prev) => prev.map((st) => st.id === s.id ? { ...st, isActive: newActive } : st));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setNewStation((p) => ({ ...p, latitude: lat, longitude: lng }));
        alert(`Location set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      (err) => {
        alert("Location error: " + err.message + "\n\nPlease allow location access or enter coordinates manually.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  return (
    <DashboardShell title="My Stations">
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-green-400/10 to-emerald-500/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Stations Management</h2>
              <p className="text-slate-400 mt-1">Manage your PSPCS charging stations.</p>
            </div>
            {canAddStation ? (
              <button onClick={() => { playClick(); setShowAdd(!showAdd); }}
                className="px-4 py-2 text-sm font-medium text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                + Add Station
              </button>
            ) : (
              <span className="text-xs px-3 py-1 bg-red-400/10 text-red-400 rounded-full">Payment Required</span>
            )}
          </div>
        </div>

        {!canAddStation && (
          <div className="glass-card rounded-2xl p-6 border-2 border-red-400/30">
            <div className="text-center">
              <div className="text-4xl mb-3">💳</div>
              <h4 className="text-lg font-bold text-white mb-2">Monthly Payment Required</h4>
              <p className="text-sm text-slate-400">You need to pay your monthly station fee before you can add stations.</p>
            </div>
          </div>
        )}

        {/* Add Station Form */}
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
              <div className="flex items-end gap-3">
                <button onClick={addStation} disabled={!newStation.name || !newStation.address}
                  className="flex-1 py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg disabled:opacity-50">Add Station</button>
                <button onClick={() => { playClick(); setShowAdd(false); }} className="px-4 py-3 text-sm text-slate-400 border border-slate-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* My Stations List */}
        {myStations.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Your Stations ({myStations.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myStations.map((s) => (
                <div key={s.id} className="glass-card rounded-xl p-4">
                  <h4 className="font-bold text-white text-sm">{s.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{s.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {(s as any).companyName && (s as any).companyName !== "Pending" ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">{(s as any).companyName}</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">Waiting for Company</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {s.cableTypeC > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">TC:{s.cableTypeC}</span>}
                    {s.cableIPhone > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">iP:{s.cableIPhone}</span>}
                    {s.cableUniversal > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded">USB:{s.cableUniversal}</span>}
                    {s.outlets > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">O:{s.outlets}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-[10px] text-slate-500">{s.views || 0} views | {(s.viewRevenue || 0).toFixed(1)} pts</span>
                    <div className="flex gap-2">
                      <button onClick={() => toggleStation(s)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full ${s.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </button>
                      <button onClick={() => startEdit(s)}
                        className="px-3 py-1 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                        Edit
                      </button>
                      <button onClick={() => removeStation(s.id, s.name)}
                        className="px-3 py-1 text-[10px] font-bold rounded-full bg-red-600/10 text-red-400 hover:bg-red-600/20">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Station Modal */}
        {editStation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-white mb-4">Edit Station</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Name</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Address</label>
                  <input type="text" value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-300 mb-1">Type-C</label>
                    <input type="number" min={0} value={editForm.cableTypeC} onChange={(e) => setEditForm((p) => ({ ...p, cableTypeC: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-300 mb-1">iPhone</label>
                    <input type="number" min={0} value={editForm.cableIPhone} onChange={(e) => setEditForm((p) => ({ ...p, cableIPhone: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-300 mb-1">USB</label>
                    <input type="number" min={0} value={editForm.cableUniversal} onChange={(e) => setEditForm((p) => ({ ...p, cableUniversal: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-300 mb-1">Outlets</label>
                    <input type="number" min={0} value={editForm.outlets} onChange={(e) => setEditForm((p) => ({ ...p, outlets: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditForm((p) => ({ ...p, active: !p.active }))}
                    className={`px-4 py-2 text-sm font-bold rounded-lg ${editForm.active ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                    {editForm.active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={saveEdit} className="flex-1 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg">Save</button>
                <button onClick={() => { playClick(); setEditStation(null); }} className="px-6 py-3 text-slate-400 border border-slate-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* All Stations Map */}
        <section>
          <h3 className="text-lg font-bold text-white mb-4">All PSPCS Stations</h3>
          <StationMap stations={stations} onSelect={setSelectedStation} selectedId={selectedStation?.id} showAllBrands={userData?.isSubscribed || false} />
        </section>
      </div>
    </DashboardShell>
  );
}
