"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap, Station } from "@/components/StationMap";
import { apiFetch } from "@/lib/api-fetch";

interface MonthlyPayment { id: number; amount: number; reference_number: string; status: string; paid_for_month: string; created_at: string; }
interface Redemption { id: number; redemption_type: string; redemption_label?: string; amount: number; status: string; contact_name: string | null; contact_number: string | null; delivery_address: string | null; created_at: string; }
type RedemptionType = "free_station" | "station_parts" | "coin_slots" | "charging_cable" | null;
interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; contactNumber: string | null; subscriptionExpiry: string | null; }

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export default function BranchOwnerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [monthlyReferenceNumber, setMonthlyReferenceNumber] = useState("");
  const [requestingMonthly, setRequestingMonthly] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemType, setRedeemType] = useState<RedemptionType>(null);
  const [redeemForm, setRedeemForm] = useState({ contactName: "", contactNumber: "", deliveryAddress: "" });
  const [requestingRedeem, setRequestingRedeem] = useState(false);
  const [newStation, setNewStation] = useState({
    name: "", address: "", latitude: 14.5995, longitude: 120.9842,
    cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1,
  });

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/monthly-payments").then((r) => r.json()),
      apiFetch("/api/redemptions").then((r) => r.json()),
    ]).then(([meRes, stRes, mpRes, rdRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) {
        console.log("Branch Owner - User data:", meRes.value.user);
        setUserData(meRes.value.user);
      }
      if (stRes.status === "fulfilled" && stRes.value.stations) setStations(stRes.value.stations);
      if (mpRes.status === "fulfilled" && mpRes.value.payments) setMonthlyPayments(mpRes.value.payments);
      if (rdRes.status === "fulfilled" && rdRes.value.redemptions) setRedemptions(rdRes.value.redemptions);
    }).catch(() => {});
  }, []);

  // Refresh user data
  async function refreshUserData() {
    try {
      const res = await apiFetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        console.log("Refreshed user data:", data.user);
        setUserData(data.user);
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
    }
  }

  async function requestMonthlyPayment() {
    if (!monthlyReferenceNumber.trim()) {
      alert("Please enter your GCash reference number");
      return;
    }
    setRequestingMonthly(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const res = await apiFetch("/api/monthly-payments", { method: "POST", body: JSON.stringify({ referenceNumber: monthlyReferenceNumber.trim(), paidForMonth: currentMonth }) });
      const data = await res.json();
      if (res.ok) {
        alert("Monthly payment request sent! Waiting for company owner approval.");
        setMonthlyReferenceNumber("");
        try {
          const refreshRes = await apiFetch("/api/monthly-payments");
          const refreshData = await refreshRes.json();
          if (refreshData.payments) setMonthlyPayments(refreshData.payments);
        } catch (refreshErr) {
          console.error("Error refreshing payments:", refreshErr);
        }
      } else {
        alert("Error: " + (data.error || "Failed to send request"));
      }
    } catch (err) { 
      console.error("Error sending monthly payment request:", err);
      alert("Error sending request: " + String(err)); 
    }
    setRequestingMonthly(false);
  }

  async function requestRedemption() {
    if (!redeemType) return;
    
    setRequestingRedeem(true);
    try {
      const body: any = { redemptionType: redeemType };
      if (redeemType === "free_station") {
        body.contactName = redeemForm.contactName;
        body.contactNumber = redeemForm.contactNumber;
        body.deliveryAddress = redeemForm.deliveryAddress;
      }
      
      const res = await apiFetch("/api/redemptions", { method: "POST", body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        alert("Redemption request submitted! Company owner will process it soon.");
        setShowRedeemModal(false);
        setRedeemType(null);
        setRedeemForm({ contactName: "", contactNumber: "", deliveryAddress: "" });
        // Refresh data
        try {
          const [stRes, rdRes] = await Promise.all([
            apiFetch("/api/stations"),
            apiFetch("/api/redemptions"),
          ]);
          const stData = await stRes.json();
          const rdData = await rdRes.json();
          if (stData.stations) setStations(stData.stations);
          if (rdData.redemptions) setRedemptions(rdData.redemptions);
        } catch (refreshErr) {
          console.error("Error refreshing:", refreshErr);
        }
      } else {
        alert("Error: " + (data.error || "Failed to submit redemption"));
      }
    } catch (err) {
      console.error("Error submitting redemption:", err);
      alert("Error: " + String(err));
    }
    setRequestingRedeem(false);
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

  const [editStation, setEditStation] = useState<Station | null>(null);
  const [editForm, setEditForm] = useState({ name: "", address: "", active: true, cableTypeC: 0, cableIPhone: 0, cableUniversal: 0, outlets: 1 });

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

  const myStations = stations.filter((s) => s.ownerId === userData?.id);
  const totalViews = myStations.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalViewRevenue = myStations.reduce((sum, s) => sum + (s.viewRevenue || 0), 0);
  const canRedeem = totalViewRevenue >= 100;
  const canAddStation = userData?.isSubscribed === true;
  const monthlyFee = userData?.role === "other_branch" ? 100 : 75;

  return (
    <DashboardShell title="Branch Owner Dashboard">
      <div className="space-y-8">
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-green-400/10 to-emerald-500/5">
          <h2 className="text-2xl font-bold text-white">Welcome, {userData?.fullName || "Station Owner"}!</h2>
          <p className="text-slate-400 mt-1">Manage your PSPCS stations.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="px-4 py-3 bg-green-400/10 rounded-lg"><div className="text-lg font-bold text-green-400">{myStations.length}</div><div className="text-xs text-slate-400">My Stations</div></div>
            <div className="px-4 py-3 bg-amber-400/10 rounded-lg"><div className="text-lg font-bold text-amber-400">{myStations.filter((s) => s.isActive).length}</div><div className="text-xs text-slate-400">Active Stations</div></div>
            <div className="px-4 py-3 bg-blue-400/10 rounded-lg"><div className="text-lg font-bold text-blue-400">{totalViews}</div><div className="text-xs text-slate-400">Total Views</div></div>
            <div className="px-4 py-3 bg-purple-400/10 rounded-lg"><div className="text-lg font-bold text-purple-400">{totalViewRevenue.toFixed(1)}</div><div className="text-xs text-slate-400">Points</div></div>
          </div>
        </div>

        {/* Add Station */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Your Stations</h3>
          {canAddStation ? (
            <button onClick={() => { playClick(); setShowAdd(!showAdd); }}
              className="px-4 py-2 text-sm font-medium text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
              + Add Station
            </button>
          ) : (
            <span className="text-xs px-3 py-1 bg-red-400/10 text-red-400 rounded-full">Payment Required</span>
          )}
        </div>

        {!canAddStation && (
          <div className="glass-card rounded-2xl p-6 border-2 border-red-400/30">
            <div className="text-center">
              <div className="text-4xl mb-3">💳</div>
              <h4 className="text-lg font-bold text-white mb-2">Monthly Payment Required</h4>
              <p className="text-sm text-slate-400 mb-4">You need to pay your monthly station fee (₱{monthlyFee}/month) before you can add stations.</p>
              <p className="text-xs text-amber-400">Scroll down to the Monthly Station Fee section to make your payment.</p>
            </div>
          </div>
        )}

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

        {/* My Stations */}
        {myStations.length > 0 && (
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
                  <span className="text-[10px] text-slate-500">{s.views || 0} views | ₱{(s.viewRevenue || 0).toFixed(2)}</span>
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

        <section id="stations">
          <h3 className="text-lg font-bold text-white mb-4">All PSPCS Stations</h3>
          <StationMap stations={stations} onSelect={setSelectedStation} selectedId={selectedStation?.id} showAllBrands={userData?.isSubscribed || false} />
        </section>

        {/* Revenue - Points Based */}
        <section id="revenue" className="space-y-4">
          <h3 className="text-lg font-bold text-white">Points System</h3>
          <p className="text-sm text-slate-400">Earn 0.1 points per view when someone views your station!</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400">{myStations.length}</div>
              <div className="text-xs text-slate-400">Your Stations</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-400">{totalViews}</div>
              <div className="text-xs text-slate-400">Total Views</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">{totalViewRevenue.toFixed(1)}</div>
              <div className="text-xs text-slate-400">Total Points</div>
            </div>
          </div>

          {/* Redemption Tiers */}
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Redeem Points</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-xl border ${totalViewRevenue >= 1000 ? "border-green-400 bg-green-400/10" : "border-slate-600"}`}>
                <div className="text-xs text-slate-400">Full Station</div>
                <div className="text-lg font-bold text-white">1000 pts</div>
                <div className="text-[10px] text-slate-500">Free Charging Station</div>
              </div>
              <div className={`p-3 rounded-xl border ${totalViewRevenue >= 500 ? "border-amber-400 bg-amber-400/10" : "border-slate-600"}`}>
                <div className="text-xs text-slate-400">All Parts</div>
                <div className="text-lg font-bold text-white">500 pts</div>
                <div className="text-[10px] text-slate-500">Station Parts</div>
              </div>
              <div className={`p-3 rounded-xl border ${totalViewRevenue >= 100 ? "border-blue-400 bg-blue-400/10" : "border-slate-600"}`}>
                <div className="text-xs text-slate-400">Coin Slots</div>
                <div className="text-lg font-bold text-white">100 pts</div>
                <div className="text-[10px] text-slate-500">3 Coin Slots</div>
              </div>
              <div className={`p-3 rounded-xl border ${totalViewRevenue >= 50 ? "border-purple-400 bg-purple-400/10" : "border-slate-600"}`}>
                <div className="text-xs text-slate-400">Cable</div>
                <div className="text-lg font-bold text-white">50 pts</div>
                <div className="text-[10px] text-slate-500">Charging Cable</div>
              </div>
            </div>
            
            {totalViewRevenue >= 50 && (
              <button onClick={() => { playClick(); setShowRedeemModal(true); }}
                className="w-full py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                Redeem Points ({totalViewRevenue.toFixed(1)} pts)
              </button>
            )}
          </div>

          {/* Per Station Views */}
          {myStations.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-bold text-white mb-4">Points per Station</h4>
              <div className="space-y-3">
                {myStations.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.views || 0} views</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-400">{(s.viewRevenue || 0).toFixed(1)} pts</p>
                      <p className="text-[10px] text-slate-500">{s.isActive ? "Active" : "Inactive"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Redemption History */}
        {redemptions.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-white">Redemption History</h3>
            <div className="glass-card rounded-2xl p-6">
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {redemptions.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {r.amount} pts - {r.redemption_label || r.redemption_type}
                        </p>
                        <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${r.status === "approved" ? "bg-green-400/10 text-green-400" : r.status === "delivered" ? "bg-blue-400/10 text-blue-400" : r.status === "rejected" ? "bg-red-400/10 text-red-400" : "bg-amber-400/10 text-amber-400"}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Redemption Modal */}
        {showRedeemModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-white mb-2">Redeem Points</h3>
              <p className="text-sm text-slate-400 mb-4">Available: {totalViewRevenue.toFixed(1)} points</p>
              
              <div className="space-y-3">
                {[
                  { type: "free_station", label: "Free Charging Station", desc: "Full unit - Company delivers", points: 1000, icon: "🏪" },
                  { type: "station_parts", label: "Charging Station Parts", desc: "All parts", points: 500, icon: "🔧" },
                  { type: "coin_slots", label: "3 Coin Slots", desc: "Coin slot mechanism", points: 100, icon: "🪙" },
                  { type: "charging_cable", label: "Charging Cable", desc: "USB charging cable", points: 50, icon: "🔌" },
                ].map((tier) => (
                  <button key={tier.type}
                    onClick={() => setRedeemType(tier.type as any)}
                    disabled={totalViewRevenue < tier.points}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      redeemType === tier.type ? "border-green-400 bg-green-400/10" : 
                      totalViewRevenue >= tier.points ? "border-slate-600 hover:border-slate-500" : "border-slate-700 opacity-50"
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tier.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-white">{tier.label}</p>
                          <p className="text-xs text-slate-400">{tier.desc}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${totalViewRevenue >= tier.points ? "text-green-400" : "text-slate-500"}`}>
                        {tier.points} pts
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {(redeemType === "free_station" || redeemType === "station_parts") && (
                <div className="space-y-3 mt-4 p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Full Name</label>
                    <input type="text" value={redeemForm.contactName} onChange={(e) => setRedeemForm((p) => ({ ...p, contactName: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Contact Number</label>
                    <input type="text" value={redeemForm.contactNumber} onChange={(e) => setRedeemForm((p) => ({ ...p, contactNumber: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" placeholder="09XX XXX XXXX" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Delivery Address</label>
                    <textarea value={redeemForm.deliveryAddress} onChange={(e) => setRedeemForm((p) => ({ ...p, deliveryAddress: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400" rows={3} placeholder="Full delivery address" />
                  </div>
                </div>
              )}

              {redeemType === "coin_slots" && (
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-xs text-blue-400 mb-2">Claim Info</p>
                  <p className="text-sm text-white">Contact earlrey0322@gmail.com to claim your 3 coin slots.</p>
                </div>
              )}

              {redeemType === "charging_cable" && (
                <div className="mt-4 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
                  <p className="text-xs text-purple-400 mb-2">Claim Info</p>
                  <p className="text-sm text-white">Contact earlrey0322@gmail.com to claim your charging cable.</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={requestRedemption} disabled={!redeemType || requestingRedeem}
                  className="flex-1 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg disabled:opacity-50">
                  {requestingRedeem ? "Submitting..." : "Submit Redemption"}
                </button>
                <button onClick={() => { setShowRedeemModal(false); setRedeemType(null); }}
                  className="px-6 py-3 text-slate-400 border border-slate-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Payment Section */}
        <section id="monthly-payment" className="space-y-6">
          <h3 className="text-lg font-bold text-white mb-4">Monthly Station Fee</h3>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-white">Monthly Payment</h4>
                <p className="text-sm text-slate-400">
                  {userData?.role === "other_branch" ? "₱100/month" : "₱75/month"} - Non-refundable
                </p>
              </div>
              <span className="text-xs px-2 py-1 bg-amber-400/10 text-amber-400 rounded-full">
                ₱{userData?.role === "other_branch" ? "100" : "75"}/month
              </span>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl mb-4">
              <p className="text-xs text-blue-400 mb-2">GCash Payment</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Number</span><span className="text-white font-bold">09469086926</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-white">Earl Christian Rey</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-amber-400 font-bold">₱{userData?.role === "other_branch" ? "100" : "75"}</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">GCash Reference Number</label>
                <input type="text" value={monthlyReferenceNumber} onChange={(e) => setMonthlyReferenceNumber(e.target.value)}
                  placeholder="Enter reference number from GCash"
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
              </div>

              <button onClick={requestMonthlyPayment} disabled={requestingMonthly || !monthlyReferenceNumber.trim()}
                className="w-full py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg disabled:opacity-50">
                {requestingMonthly ? "Sending..." : "Request Monthly Due"}
              </button>
            </div>
          </div>

          {/* Monthly Payment History */}
          {monthlyPayments.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-bold text-white mb-4">Payment History</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {monthlyPayments.map((payment) => (
                  <div key={payment.id} className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">₱{payment.amount} - {payment.paid_for_month}</p>
                        <p className="text-xs text-slate-400">Ref: {payment.reference_number || "N/A"}</p>
                        <p className="text-xs text-slate-500">{new Date(payment.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${payment.status === "approved" ? "bg-green-400/10 text-green-400" : payment.status === "rejected" ? "bg-red-400/10 text-red-400" : "bg-amber-400/10 text-amber-400"}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Account Status */}
        <section className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white">Account Status</h4>
              <p className="text-sm text-slate-400">
                {userData?.isSubscribed ? "You can view all company stations" : "Only KLEOXM 111 stations visible"}
              </p>
              <p className="text-xs text-slate-500 mt-1">isSubscribed: {String(userData?.isSubscribed)}</p>
            </div>
            <div className="flex items-center gap-3">
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
              <button onClick={refreshUserData}
                className="px-3 py-2 text-xs font-medium text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-400/10">
                Refresh
              </button>
            </div>
          </div>
          {!userData?.isSubscribed && (
            <div className="mt-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
              <p className="text-xs text-amber-400">🔒 Pay monthly fee to become premium and unlock all features.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
