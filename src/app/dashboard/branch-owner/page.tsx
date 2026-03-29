"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap, Station } from "@/components/StationMap";
import { apiFetch } from "@/lib/api-fetch";

interface SubscriptionRequest { id: number; plan: string; status: string; created_at: string; reference_number: string; }
interface MonthlyPayment { id: number; amount: number; reference_number: string; status: string; paid_for_month: string; created_at: string; }
interface Redemption { id: number; redemption_type: string; amount: number; status: string; contact_name: string | null; contact_number: string | null; delivery_address: string | null; created_at: string; }
interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; contactNumber: string | null; subscriptionExpiry: string | null; }

const PLANS = [
  { id: "1_day", label: "1 Day", days: 1, price: 20 },
  { id: "1_week", label: "1 Week", days: 7, price: 60 },
  { id: "1_month", label: "1 Month", days: 30, price: 100 },
  { id: "3_months", label: "3 Months", days: 90, price: 170 },
  { id: "6_months", label: "6 Months", days: 180, price: 220 },
  { id: "1_year", label: "1 Year", days: 365, price: 300 },
];

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export default function BranchOwnerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [monthlyReferenceNumber, setMonthlyReferenceNumber] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestingMonthly, setRequestingMonthly] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemType, setRedeemType] = useState<"free_station" | "gcash" | null>(null);
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
      apiFetch("/api/subscription-requests").then((r) => r.json()),
      apiFetch("/api/monthly-payments").then((r) => r.json()),
      apiFetch("/api/redemptions").then((r) => r.json()),
    ]).then(([meRes, stRes, srRes, mpRes, rdRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) setUserData(meRes.value.user);
      if (stRes.status === "fulfilled" && stRes.value.stations) setStations(stRes.value.stations);
      if (srRes.status === "fulfilled" && srRes.value.requests) setSubRequests(srRes.value.requests);
      if (mpRes.status === "fulfilled" && mpRes.value.payments) setMonthlyPayments(mpRes.value.payments);
      if (rdRes.status === "fulfilled" && rdRes.value.redemptions) setRedemptions(rdRes.value.redemptions);
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
  const monthlyFee = userData?.role === "other_branch" ? 250 : 200;

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
            <div className="px-4 py-3 bg-purple-400/10 rounded-lg"><div className="text-lg font-bold text-purple-400">₱{totalViewRevenue.toFixed(2)}</div><div className="text-xs text-slate-400">View Revenue</div></div>
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
          <StationMap stations={stations} onSelect={(s) => setSelectedStation(s)} selectedId={selectedStation?.id} showAllBrands={userData?.isSubscribed || false} />
        </section>

        {/* Revenue - View Based */}
        <section id="revenue" className="space-y-4">
          <h3 className="text-lg font-bold text-white">View Revenue</h3>
          <p className="text-sm text-slate-400">Earn ₱0.20 per view when someone views your station!</p>
          
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
              <div className="text-2xl font-bold text-blue-400">₱{totalViewRevenue.toFixed(2)}</div>
              <div className="text-xs text-slate-400">Available Revenue</div>
            </div>
          </div>

          {/* Redemption Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-white">Redeem Earnings</h4>
                <p className="text-sm text-slate-400">Minimum ₱100 required to redeem</p>
              </div>
              {canRedeem && (
                <button onClick={() => { playClick(); setShowRedeemModal(true); }}
                  className="px-4 py-2 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                  Redeem ₱{Math.floor(totalViewRevenue)}
                </button>
              )}
            </div>
            
            {!canRedeem && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Progress to ₱100</span>
                  <span className="text-sm font-bold text-amber-400">{Math.floor(totalViewRevenue)} / 100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(totalViewRevenue, 100)}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Per Station Views */}
          {myStations.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-bold text-white mb-4">Views per Station</h4>
              <div className="space-y-3">
                {myStations.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.views || 0} views</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">₱{(s.viewRevenue || 0).toFixed(2)}</p>
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
                          ₱{r.amount} - {r.redemption_type === "free_station" ? "Free Station" : "GCash Cashout"}
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
              <h3 className="text-lg font-bold text-white mb-4">Redeem Earnings</h3>
              <p className="text-sm text-slate-400 mb-4">Available: ₱{Math.floor(totalViewRevenue)}</p>
              
              <div className="space-y-4">
                <button onClick={() => setRedeemType("free_station")}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${redeemType === "free_station" ? "border-green-400 bg-green-400/10" : "border-slate-600 hover:border-slate-500"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏪</span>
                    <div>
                      <p className="text-sm font-bold text-white">Free Charging Station</p>
                      <p className="text-xs text-slate-400">Company will deliver to your address</p>
                    </div>
                  </div>
                </button>
                
                <button onClick={() => setRedeemType("gcash")}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${redeemType === "gcash" ? "border-green-400 bg-green-400/10" : "border-slate-600 hover:border-slate-500"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-sm font-bold text-white">GCash Cashout</p>
                      <p className="text-xs text-slate-400">Email earlrey0322@gmail.com to receive GCash</p>
                    </div>
                  </div>
                </button>
              </div>

              {redeemType === "free_station" && (
                <div className="space-y-4 mt-4 p-4 bg-slate-800/50 rounded-lg">
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

              {redeemType === "gcash" && (
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-xs text-blue-400 mb-2">GCash Details</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Number</span><span className="text-white font-bold">09469086926</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-white">Earl Christian Rey</span></div>
                  </div>
                  <p className="text-xs text-amber-400 mt-3">Email earlrey0322@gmail.com with your reference number after sending.</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={requestRedemption} disabled={!redeemType || requestingRedeem || (redeemType === "free_station" && (!redeemForm.contactName || !redeemForm.contactNumber || !redeemForm.deliveryAddress))}
                  className="flex-1 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg disabled:opacity-50">
                  {requestingRedeem ? "Submitting..." : "Submit Redemption"}
                </button>
                <button onClick={() => { setShowRedeemModal(false); setRedeemType(null); }}
                  className="px-6 py-3 text-slate-400 border border-slate-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <section id="subscription">
          <h3 className="text-lg font-bold text-white mb-4">Subscription</h3>
          <div className="space-y-6">
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

        {/* Monthly Payment Section */}
        <section id="monthly-payment" className="space-y-6">
          <h3 className="text-lg font-bold text-white mb-4">Monthly Station Fee</h3>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-white">Monthly Payment</h4>
                <p className="text-sm text-slate-400">
                  {userData?.role === "other_branch" ? "₱250/month" : "₱200/month"} - Non-refundable
                </p>
              </div>
              <span className="text-xs px-2 py-1 bg-amber-400/10 text-amber-400 rounded-full">
                ₱{userData?.role === "other_branch" ? "250" : "200"}/month
              </span>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl mb-4">
              <p className="text-xs text-blue-400 mb-2">GCash Payment</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Number</span><span className="text-white font-bold">09469086926</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-white">Earl Christian Rey</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-amber-400 font-bold">₱{userData?.role === "other_branch" ? "250" : "200"}</span></div>
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
      </div>
    </DashboardShell>
  );
}
