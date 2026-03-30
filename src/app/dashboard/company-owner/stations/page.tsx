"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap, Station } from "@/components/StationMap";
import { apiFetch } from "@/lib/api-fetch";

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", location: "", address: "", latitude: 14.5995, longitude: 120.9842, companyName: "KLEOXM 111", cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1 });
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [editForm, setEditForm] = useState({ name: "", location: "", address: "", company: "", active: true, cableTypeC: 0, cableIPhone: 0, cableUniversal: 0, outlets: 1 });

  useEffect(() => {
    apiFetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        if (data.stations) setStations(data.stations);
      })
      .catch((err) => console.error("Stations fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  async function toggleStation(s: Station) {
    playClick();
    await apiFetch("/api/stations", { method: "PATCH", body: JSON.stringify({ id: s.id, isActive: !s.isActive }) });
    setStations((prev) => prev.map((st) => st.id === s.id ? { ...st, isActive: !st.isActive } : st));
  }

  function startEdit(s: Station) {
    playClick();
    setEditStation(s);
    setEditForm({ name: s.name, location: (s as any).location || "", address: s.address, company: s.companyName, active: s.isActive, cableTypeC: s.cableTypeC || 0, cableIPhone: s.cableIPhone || 0, cableUniversal: s.cableUniversal || 0, outlets: s.outlets || 1 });
  }

  async function saveEdit() {
    if (!editStation) return;
    playClick();
    await apiFetch("/api/stations", { method: "PATCH", body: JSON.stringify({ id: editStation.id, name: editForm.name, location: editForm.location, address: editForm.address, company: editForm.company, active: editForm.active, cableTypeC: editForm.cableTypeC, cableIPhone: editForm.cableIPhone, cableUniversal: editForm.cableUniversal, outlets: editForm.outlets }) });
    setStations((prev) => prev.map((s) => s.id === editStation.id ? { ...s, name: editForm.name, location: editForm.location, address: editForm.address, companyName: editForm.company, isActive: editForm.active, cableTypeC: editForm.cableTypeC, cableIPhone: editForm.cableIPhone, cableUniversal: editForm.cableUniversal, outlets: editForm.outlets } : s));
    setEditStation(null);
  }

  async function addStation() {
    playClick();
    try {
      const res = await apiFetch("/api/stations", { method: "POST", body: JSON.stringify(addForm) });
      const d = await res.json();
      if (res.ok && d.station) {
        setStations((p) => [...p, d.station]);
        setShowAdd(false);
        setAddForm({ name: "", location: "", address: "", latitude: 14.5995, longitude: 120.9842, companyName: "KLEOXM 111", cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1 });
      } else {
        alert("Error: " + (d.error || "Failed to add station"));
      }
    } catch (err) { alert("Error: " + String(err)); }
  }

  async function removeStation(id: number, name: string) {
    playClick();
    if (!confirm(`Remove "${name}"?`)) return;
    await apiFetch("/api/stations", { method: "DELETE", body: JSON.stringify({ id }) });
    setStations((prev) => prev.filter((s) => s.id !== id));
  }

  function useLocation() {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setAddForm((f) => ({ ...f, latitude: p.coords.latitude, longitude: p.coords.longitude }));
        alert(`Location set: ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`);
      },
      (err) => { alert("Location error: " + err.message); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  if (loading) {
    return (
      <DashboardShell title="Stations Management">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Loading stations...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Stations Management">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Stations</h2>
            <p className="text-slate-400 mt-1">{stations.length} total stations, {stations.filter((s) => s.isActive).length} active</p>
          </div>
          <button onClick={() => { playClick(); setShowAdd(!showAdd); }} className="px-4 py-2 text-sm font-medium text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg">+ Add Station</button>
        </div>

        {/* Add Station Form */}
        {showAdd && (
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Add New Station</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm text-slate-300 mb-1">Name</label><input type="text" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" placeholder="PSPCS Station - Name" /></div>
              <div><label className="block text-sm text-slate-300 mb-1">Location</label><input type="text" value={addForm.location} onChange={(e) => setAddForm((p) => ({ ...p, location: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" placeholder="e.g. Lucena City, Quezon" /></div>
              <div><label className="block text-sm text-slate-300 mb-1">Company Name</label><input type="text" value={addForm.companyName} onChange={(e) => setAddForm((p) => ({ ...p, companyName: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
              <div><label className="block text-sm text-slate-300 mb-1">Address</label><input type="text" value={addForm.address} onChange={(e) => setAddForm((p) => ({ ...p, address: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
              <div><label className="block text-sm text-slate-300 mb-1">Latitude</label><input type="number" step="0.0001" value={addForm.latitude} onChange={(e) => setAddForm((p) => ({ ...p, latitude: Number(e.target.value) }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
              <div><label className="block text-sm text-slate-300 mb-1">Longitude</label><input type="number" step="0.0001" value={addForm.longitude} onChange={(e) => setAddForm((p) => ({ ...p, longitude: Number(e.target.value) }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
              <div className="md:col-span-2"><button onClick={useLocation} className="w-full py-3 text-sm font-medium text-green-400 border border-green-400/30 rounded-lg hover:bg-green-400/10">Use Current Location</button></div>
              <div><label className="block text-sm text-slate-300 mb-1">Type-C</label><input type="number" min={0} value={addForm.cableTypeC} onChange={(e) => setAddForm((p) => ({ ...p, cableTypeC: Number(e.target.value) }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
              <div><label className="block text-sm text-slate-300 mb-1">iPhone</label><input type="number" min={0} value={addForm.cableIPhone} onChange={(e) => setAddForm((p) => ({ ...p, cableIPhone: Number(e.target.value) }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
              <div><label className="block text-sm text-slate-300 mb-1">USB</label><input type="number" min={0} value={addForm.cableUniversal} onChange={(e) => setAddForm((p) => ({ ...p, cableUniversal: Number(e.target.value) }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
              <div><label className="block text-sm text-slate-300 mb-1">Outlets</label><input type="number" min={0} value={addForm.outlets} onChange={(e) => setAddForm((p) => ({ ...p, outlets: Number(e.target.value) }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
              <div className="md:col-span-2 flex gap-3">
                <button onClick={addStation} disabled={!addForm.name || !addForm.address} className="flex-1 py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg disabled:opacity-50">Add Station</button>
                <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-sm text-slate-400 border border-slate-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Station Map */}
        <StationMap stations={stations} onSelect={(s) => setSelectedStation(s)} selectedId={selectedStation?.id} showAllBrands={true} />

        {/* Stations List */}
        <div className="glass-card rounded-2xl p-6">
          <h4 className="font-bold text-white mb-4">Manage Stations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((s) => (
              <div key={s.id} className="bg-slate-800/50 rounded-xl p-4">
                <h4 className="font-bold text-white text-sm">{s.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-amber-400">{s.companyName || "Pending"}</p>
                  {s.companyName && s.companyName !== "KLEOXM 111" && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">Premium</span>
                  )}
                  {s.companyName === "KLEOXM 111" && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded">Regular</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{s.address}</p>
                <div className="flex gap-1.5 mt-2">
                  {s.cableTypeC > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">TC:{s.cableTypeC}</span>}
                  {s.cableIPhone > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">iP:{s.cableIPhone}</span>}
                  {s.cableUniversal > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded">USB:{s.cableUniversal}</span>}
                  {s.outlets > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">O:{s.outlets}</span>}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                  <span className="text-[10px] text-slate-500">{s.totalVisits} visits</span>
                  <div className="flex gap-2">
                    <button onClick={() => toggleStation(s)} className={`px-3 py-1 text-[10px] font-bold rounded-full ${s.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => startEdit(s)} className="px-3 py-1 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">Edit</button>
                    <button onClick={() => removeStation(s.id, s.name)} className="px-3 py-1 text-[10px] font-bold rounded-full bg-red-600/10 text-red-400 hover:bg-red-600/20">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Station Modal */}
        {editStation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-white mb-4">Edit Station</h3>
              <div className="space-y-4">
                <div><label className="block text-sm text-slate-300 mb-1">Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
                <div><label className="block text-sm text-slate-300 mb-1">Location</label><input type="text" value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Company Name</label>
                  <input type="text" value={editForm.company} onChange={(e) => setEditForm((p) => ({ ...p, company: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
                  <p className="text-xs text-slate-500 mt-1">KLEOXM 111 = Regular (visible to all), Other = Premium only</p>
                </div>
                <div><label className="block text-sm text-slate-300 mb-1">Address</label><input type="text" value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
                <div className="flex gap-4">
                  <div className="flex-1"><label className="block text-sm text-slate-300 mb-1">Type-C</label><input type="number" min={0} value={editForm.cableTypeC} onChange={(e) => setEditForm((p) => ({ ...p, cableTypeC: Number(e.target.value) }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
                  <div className="flex-1"><label className="block text-sm text-slate-300 mb-1">iPhone</label><input type="number" min={0} value={editForm.cableIPhone} onChange={(e) => setEditForm((p) => ({ ...p, cableIPhone: Number(e.target.value) }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1"><label className="block text-sm text-slate-300 mb-1">USB</label><input type="number" min={0} value={editForm.cableUniversal} onChange={(e) => setEditForm((p) => ({ ...p, cableUniversal: Number(e.target.value) }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
                  <div className="flex-1"><label className="block text-sm text-slate-300 mb-1">Outlets</label><input type="number" min={0} value={editForm.outlets} onChange={(e) => setEditForm((p) => ({ ...p, outlets: Number(e.target.value) }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" /></div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditForm((p) => ({ ...p, active: !p.active }))} className={`px-4 py-2 text-sm font-bold rounded-lg ${editForm.active ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>{editForm.active ? "Active" : "Inactive"}</button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={saveEdit} className="flex-1 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg">Save</button>
                <button onClick={() => { playClick(); setEditStation(null); }} className="px-6 py-3 text-slate-400 border border-slate-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
