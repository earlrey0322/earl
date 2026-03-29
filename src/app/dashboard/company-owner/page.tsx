"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap, Station } from "@/components/StationMap";
import { ChargingCalculator } from "@/components/ChargingCalculator";
import { apiFetch } from "@/lib/api-fetch";

const PLAN_PRICES: Record<string, number> = {
  "1_day": 20,
  "1_week": 60,
  "1_month": 100,
  "3_months": 170,
  "6_months": 220,
  "1_year": 300,
};

interface HistoryItem {
  id: number; phoneBrand: string; startBattery: number; targetBattery: number;
  costPesos: number; durationMinutes: number; stationName: string; userEmail: string; createdAt: string;
}

interface Notification { id: number; subject: string; message: string; type: string; isRead: boolean; }

interface SubscriptionRequest { id: number; user_id: number; user_email: string; user_name: string; user_role: string; plan: string; status: string; reference_number: string; created_at: string; }

interface MonthlyPayment { id: number; user_id: number; user_email: string; user_name: string; user_role: string; amount: number; reference_number: string; status: string; paid_for_month: string; created_at: string; }

interface CompanyUser { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; subscriptionPlan: string | null; }

interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; }

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export default function CompanyOwnerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [usersData, setUsersData] = useState<{ totalUsers: number; totalBranchOwners: number; totalCustomers: number; subscribedBranchOwners: number; subscribedCustomers: number; users: CompanyUser[] } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<SubscriptionRequest | null>(null);
  const [approveDays, setApproveDays] = useState(1);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", location: "", address: "", latitude: 14.5995, longitude: 120.9842, companyName: "KLEOXM 111", cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1 });

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/sessions").then((r) => r.json()),
      apiFetch("/api/users").then((r) => r.json()),
      apiFetch("/api/notifications").then((r) => r.json()),
      apiFetch("/api/subscription-requests").then((r) => r.json()),
      apiFetch("/api/monthly-payments").then((r) => r.json()),
    ]).then(([meR, stR, hiR, usR, noR, srR, mpR]) => {
      if (meR.status === "fulfilled" && meR.value.user) setUserData(meR.value.user);
      if (stR.status === "fulfilled" && stR.value.stations) setStations(stR.value.stations);
      if (hiR.status === "fulfilled" && hiR.value.history) setHistory(hiR.value.history);
      if (usR.status === "fulfilled" && usR.value.totalUsers !== undefined) setUsersData(usR.value);
      if (noR.status === "fulfilled" && noR.value.notifications) setNotifications(noR.value.notifications);
      if (srR.status === "fulfilled" && srR.value.requests) setSubRequests(srR.value.requests);
      if (mpR.status === "fulfilled" && mpR.value.payments) setMonthlyPayments(mpR.value.payments);
    }).catch(() => {});
  }, []);

  async function toggleStation(s: Station) {
    playClick();
    await apiFetch("/api/stations", { method: "PATCH", body: JSON.stringify({ id: s.id, isActive: !s.isActive }) });
    setStations((prev) => prev.map((st) => st.id === s.id ? { ...st, isActive: !st.isActive } : st));
  }

  const [editStation, setEditStation] = useState<Station | null>(null);
  const [editForm, setEditForm] = useState({ name: "", location: "", address: "", company: "", active: true, cableTypeC: 0, cableIPhone: 0, cableUniversal: 0, outlets: 1 });

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
      } else {
        alert("Error: " + (d.error || "Failed to add station"));
      }
    } catch (err) { alert("Error: " + String(err)); }
  }

  async function togglePremium(userId: number, makePremium: boolean) {
    playClick();
    try {
      await apiFetch("/api/admin/users", { method: "PATCH", body: JSON.stringify({ userId, isPremium: makePremium }) });
      if (usersData) setUsersData({ ...usersData, users: usersData.users.map((u) => u.id === userId ? { ...u, isSubscribed: makePremium, subscriptionPlan: makePremium ? "lifetime" : null } : u) });
    } catch (err) { alert("Error: " + String(err)); }
  }

  async function handleSubscriptionRequest(requestId: number, approve: boolean, days?: number) {
    playClick();
    try {
      console.log("Handling subscription request:", { requestId, approve, days: days || approveDays });
      const res = await apiFetch("/api/subscription-requests", { method: "PATCH", body: JSON.stringify({ requestId, approve, days: days || approveDays }) });
      const data = await res.json();
      if (res.ok) {
        setSubRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: approve ? "approved" : "rejected" } : r));
        alert(`Request ${approve ? "approved" : "rejected"}!`);
        setShowApproveDialog(false);
        setApprovingRequest(null);
        // Refresh subscription requests
        try {
          const refreshRes = await apiFetch("/api/subscription-requests");
          const refreshData = await refreshRes.json();
          if (refreshData.requests) setSubRequests(refreshData.requests);
        } catch (refreshErr) {
          console.error("Error refreshing requests:", refreshErr);
        }
      } else {
        console.error("Failed to update request:", data);
        alert("Failed to update request: " + (data.error || "Unknown error"));
      }
    } catch (err) { 
      console.error("Error updating request:", err);
      alert("Error updating request: " + String(err)); 
    }
  }

  function openApproveDialog(req: SubscriptionRequest) {
    playClick();
    setApprovingRequest(req);
    // Set default days based on plan
    const defaultDays: Record<string, number> = { "1_day": 1, "1_week": 7, "1_month": 30, "3_months": 90, "6_months": 180, "1_year": 365 };
    setApproveDays(defaultDays[req.plan] || 1);
    setShowApproveDialog(true);
  }

  async function handleMonthlyPayment(paymentId: number, approve: boolean) {
    playClick();
    try {
      console.log("Handling monthly payment:", { paymentId, approve });
      const res = await apiFetch("/api/monthly-payments", { method: "PATCH", body: JSON.stringify({ paymentId, approve }) });
      const data = await res.json();
      if (res.ok) {
        setMonthlyPayments((prev) => prev.map((p) => p.id === paymentId ? { ...p, status: approve ? "approved" : "rejected" } : p));
        alert(`Monthly payment ${approve ? "approved" : "rejected"}!`);
        if (approve) {
          // Refresh users data to update subscription status
          try {
            const usersRes = await apiFetch("/api/users");
            const usersDataRefresh = await usersRes.json();
            if (usersDataRefresh.totalUsers !== undefined) setUsersData(usersDataRefresh);
          } catch (refreshErr) {
            console.error("Error refreshing users:", refreshErr);
          }
        }
        // Refresh monthly payments
        try {
          const refreshRes = await apiFetch("/api/monthly-payments");
          const refreshData = await refreshRes.json();
          if (refreshData.payments) setMonthlyPayments(refreshData.payments);
        } catch (refreshErr) {
          console.error("Error refreshing payments:", refreshErr);
        }
      } else {
        console.error("Failed to update payment:", data);
        alert("Failed to update payment: " + (data.error || "Unknown error"));
      }
    } catch (err) { 
      console.error("Error updating payment:", err);
      alert("Error updating payment: " + String(err)); 
    }
  }

  function useLocation() {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        setAddForm((f) => ({ ...f, latitude: lat, longitude: lng }));
        alert(`Location set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      (err) => { alert("Location error: " + err.message); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function removeStation(id: number, name: string) {
    playClick();
    if (!confirm(`Remove station "${name}"?`)) return;
    await apiFetch("/api/stations", { method: "DELETE", body: JSON.stringify({ id }) });
    setStations((prev) => prev.filter((s) => s.id !== id));
  }

  function handleRefresh() {
    apiFetch("/api/auth/me").then((r) => r.json()).then((d) => { if (d.user) setUserData(d.user); }).catch(() => {});
  }

  const branchOwners = usersData?.users?.filter((u) => u.role === "branch_owner") || [];
  const otherBranches = usersData?.users?.filter((u) => u.role === "other_branch") || [];
  const customers = usersData?.users?.filter((u) => u.role === "customer") || [];
  const totalRevenue = history.reduce((s, h) => s + h.costPesos, 0);
  const totalVisits = stations.reduce((s, st) => s + (st.totalVisits || 0), 0);
  // Calculate subscription revenue from approved requests
  const subscriptionRevenue = subRequests
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + (PLAN_PRICES[r.plan] || 0), 0);
  // Calculate monthly payment revenue
  const monthlyPaymentRevenue = monthlyPayments
    .filter((p) => p.status === "approved")
    .reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <DashboardShell title="Company Owner Dashboard">
      <div className="space-y-8">
        {/* Welcome */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 via-orange-500/5 to-red-500/5">
          <h2 className="text-2xl font-bold text-white">KLEOXM 111 Management</h2>
          <p className="text-slate-400 mt-1">Welcome, {userData?.fullName || "Company Owner"}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="px-4 py-3 bg-amber-400/10 rounded-lg"><div className="text-2xl font-bold text-amber-400">{stations.length}</div><div className="text-xs text-slate-400">Stations</div></div>
            <div className="px-4 py-3 bg-green-400/10 rounded-lg"><div className="text-2xl font-bold text-green-400">{stations.filter((s) => s.isActive).length}</div><div className="text-xs text-slate-400">Active</div></div>
            <div className="px-4 py-3 bg-blue-400/10 rounded-lg"><div className="text-2xl font-bold text-blue-400">{usersData?.totalBranchOwners || 0}</div><div className="text-xs text-slate-400">Branch Owners</div></div>
            <div className="px-4 py-3 bg-purple-400/10 rounded-lg"><div className="text-2xl font-bold text-purple-400">{otherBranches.length}</div><div className="text-xs text-slate-400">Other Branches</div></div>
            <div className="px-4 py-3 bg-cyan-400/10 rounded-lg"><div className="text-2xl font-bold text-cyan-400">{usersData?.totalCustomers || 0}</div><div className="text-xs text-slate-400">Customers</div></div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Notifications ({notifications.filter((n) => !n.isRead).length})</h3>
          {notifications.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No notifications yet.</p> : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className={`p-3 rounded-lg border ${n.isRead ? "bg-slate-800/50 border-slate-700/50" : "bg-amber-400/5 border-amber-400/30"}`}>
                  <p className="text-sm font-medium text-white">{n.subject}</p>
                  <p className="text-xs text-slate-400">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users */}
        <section id="users" className="space-y-6">
          <h3 className="text-lg font-bold text-white">Branch Owners & Customers</h3>
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Branch Owners ({branchOwners.length})</h4>
            {branchOwners.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">None yet.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-700"><th className="text-left py-2 text-slate-400">Name</th><th className="text-left py-2 text-slate-400">Email</th><th className="text-left py-2 text-slate-400">Plan</th><th className="text-left py-2 text-slate-400">Action</th></tr></thead><tbody>
                {branchOwners.map((u) => (<tr key={u.id} className="border-b border-slate-800"><td className="py-3 text-white">{u.fullName}</td><td className="py-3 text-slate-400">{u.email}</td><td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.isSubscribed ? "bg-amber-400/10 text-amber-400" : "bg-slate-700 text-slate-400"}`}>{u.isSubscribed ? "Lifetime" : "Free"}</span></td><td className="py-3"><button onClick={() => togglePremium(u.id, !u.isSubscribed)} className={`text-xs px-2 py-1 rounded ${u.isSubscribed ? "text-red-400 hover:bg-red-400/10" : "text-green-400 hover:bg-green-400/10"}`}>{u.isSubscribed ? "Remove Premium" : "Make Premium"}</button></td></tr>))}
              </tbody></table></div>
            )}
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Customers ({customers.length})</h4>
            {customers.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">None yet.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-700"><th className="text-left py-2 text-slate-400">Name</th><th className="text-left py-2 text-slate-400">Email</th><th className="text-left py-2 text-slate-400">Plan</th><th className="text-left py-2 text-slate-400">Action</th></tr></thead><tbody>
                {customers.map((u) => (<tr key={u.id} className="border-b border-slate-800"><td className="py-3 text-white">{u.fullName}</td><td className="py-3 text-slate-400">{u.email}</td><td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.isSubscribed ? "bg-amber-400/10 text-amber-400" : "bg-slate-700 text-slate-400"}`}>{u.isSubscribed ? "Lifetime" : "Free"}</span></td><td className="py-3"><button onClick={() => togglePremium(u.id, !u.isSubscribed)} className={`text-xs px-2 py-1 rounded ${u.isSubscribed ? "text-red-400 hover:bg-red-400/10" : "text-green-400 hover:bg-green-400/10"}`}>{u.isSubscribed ? "Remove Premium" : "Make Premium"}</button></td></tr>))}
              </tbody></table></div>
            )}
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Other Branches ({otherBranches.length}) - ₱250/month</h4>
            {otherBranches.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">None yet.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-700"><th className="text-left py-2 text-slate-400">Name</th><th className="text-left py-2 text-slate-400">Email</th><th className="text-left py-2 text-slate-400">Plan</th><th className="text-left py-2 text-slate-400">Action</th></tr></thead><tbody>
                {otherBranches.map((u) => (<tr key={u.id} className="border-b border-slate-800"><td className="py-3 text-white">{u.fullName}</td><td className="py-3 text-slate-400">{u.email}</td><td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.isSubscribed ? "bg-amber-400/10 text-amber-400" : "bg-slate-700 text-slate-400"}`}>{u.isSubscribed ? "Active" : "No Payment"}</span></td><td className="py-3"><button onClick={() => togglePremium(u.id, !u.isSubscribed)} className={`text-xs px-2 py-1 rounded ${u.isSubscribed ? "text-red-400 hover:bg-red-400/10" : "text-green-400 hover:bg-green-400/10"}`}>{u.isSubscribed ? "Remove Premium" : "Make Premium"}</button></td></tr>))}
              </tbody></table></div>
            )}
          </div>
        </section>

        {/* Subscription Requests */}
        <section id="subscription-requests" className="space-y-4">
          <h3 className="text-lg font-bold text-white">Subscription Requests</h3>
          {subRequests.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No subscription requests yet.</div>
          ) : (
            <div className="space-y-3">
              {subRequests.map((req) => (
                <div key={req.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{req.user_name}</p>
                      <p className="text-xs text-slate-400">{req.user_email} ({req.user_role})</p>
                      <p className="text-xs text-amber-400 mt-1">Plan: {req.plan.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-500">Ref: {req.reference_number || "N/A"}</p>
                      <p className="text-xs text-slate-500">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${req.status === "approved" ? "bg-green-400/10 text-green-400" : req.status === "rejected" ? "bg-red-400/10 text-red-400" : "bg-amber-400/10 text-amber-400"}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                      {req.status === "pending" && (
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => openApproveDialog(req)}
                            className="px-3 py-1 text-xs font-bold text-green-400 border border-green-400/30 rounded hover:bg-green-400/10">
                            Approve
                          </button>
                          <button onClick={() => handleSubscriptionRequest(req.id, false)}
                            className="px-3 py-1 text-xs font-bold text-red-400 border border-red-400/30 rounded hover:bg-red-400/10">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Approve Dialog */}
        {showApproveDialog && approvingRequest && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-white mb-4">Approve Subscription</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">User</p>
                  <p className="text-white font-medium">{approvingRequest.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Plan Requested</p>
                  <p className="text-amber-400 font-medium">{approvingRequest.plan.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Reference Number</p>
                  <p className="text-white font-medium">{approvingRequest.reference_number || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Set Duration (days)</label>
                  <input type="number" min={1} value={approveDays} onChange={(e) => setApproveDays(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setApproveDays(1)} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600">1 Day</button>
                    <button onClick={() => setApproveDays(7)} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600">1 Week</button>
                    <button onClick={() => setApproveDays(30)} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600">1 Month</button>
                    <button onClick={() => setApproveDays(90)} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600">3 Months</button>
                    <button onClick={() => setApproveDays(180)} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600">6 Months</button>
                    <button onClick={() => setApproveDays(365)} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600">1 Year</button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => handleSubscriptionRequest(approvingRequest.id, true, approveDays)}
                  className="flex-1 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                  Approve ({approveDays} days)
                </button>
                <button onClick={() => { setShowApproveDialog(false); setApprovingRequest(null); }}
                  className="px-6 py-3 text-slate-400 border border-slate-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Stations */}
        <section id="stations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">All Stations</h3>
            <button onClick={() => { playClick(); setShowAdd(!showAdd); }} className="px-4 py-2 text-sm font-medium text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg">+ Add Station</button>
          </div>

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

          <StationMap stations={stations} onSelect={(s) => setSelectedStation(s)} selectedId={selectedStation?.id} showAllBrands={true} />

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
                    {!s.companyName && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">Needs Setup</span>
                    )}
                  </div>
                  {(s as any).location && <p className="text-xs text-green-400 mt-1">📍 {(s as any).location}</p>}
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
                      <button onClick={() => startEdit(s)} className="px-3 py-1 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                        Edit
                      </button>
                      <button onClick={() => removeStation(s.id, s.name)} className="px-3 py-1 text-[10px] font-bold rounded-full bg-red-600/10 text-red-400 hover:bg-red-600/20">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

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
                  <label className="block text-sm text-slate-300 mb-1">Location</label>
                  <input type="text" value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" placeholder="e.g. Lucena City, Quezon" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Company Name</label>
                  <input type="text" value={editForm.company} onChange={(e) => setEditForm((p) => ({ ...p, company: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" placeholder="KLEOXM 111 or other company" />
                  <p className="text-xs text-slate-500 mt-1">KLEOXM 111 = Regular (visible to all), Other = Premium only</p>
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

        {/* Sessions & Calculator */}
        <section id="sessions">
          <h3 className="text-lg font-bold text-white mb-4">Charging Sessions & History</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChargingCalculator stationId={selectedStation?.id} stationName={selectedStation?.name}
              onSessionStart={async (data) => { const res = await apiFetch("/api/sessions", { method: "POST", body: JSON.stringify(data) }); if (res.ok) { const r = await res.json(); setHistory((p) => [r.history, ...p]); }}}
              history={history} showAllHistory={true} />
            <div className="space-y-6">
              {/* Revenue */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">Revenue</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-400/10 rounded-lg p-4"><div className="text-2xl font-bold text-blue-400">₱{subscriptionRevenue}</div><div className="text-xs text-slate-400">Subscription Revenue</div></div>
                  <div className="bg-purple-400/10 rounded-lg p-4"><div className="text-2xl font-bold text-purple-400">₱{monthlyPaymentRevenue}</div><div className="text-xs text-slate-400">Monthly Payments</div></div>
                </div>
                <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-green-400">Total Revenue</p>
                      <p className="text-xs text-slate-400">Subscriptions + Monthly Payments</p>
                    </div>
                    <p className="text-2xl font-bold text-green-400">₱{subscriptionRevenue + monthlyPaymentRevenue}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section id="subscription" className="space-y-6">
          <h3 className="text-lg font-bold text-white">Subscriptions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-bold text-white mb-4">Premium Users</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Subscribed Branch Owners</span><span className="text-amber-400 font-bold">{usersData?.subscribedBranchOwners || 0} / {usersData?.totalBranchOwners || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Subscribed Customers</span><span className="text-amber-400 font-bold">{usersData?.subscribedCustomers || 0} / {usersData?.totalCustomers || 0}</span></div>
              </div>
              <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-green-400">Company Owner</p>
                    <p className="text-xs text-slate-400">Lifetime Premium (Auto)</p>
                  </div>
                  <div className="px-3 py-1 bg-amber-400 text-[#0f172a] text-xs font-bold rounded-full">★ PREMIUM</div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-bold text-white mb-4">GCash Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">GCash</span><span className="text-white font-bold">09469086926</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-white">Earl Christian Rey</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Pricing</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">1 Day</span><span className="text-amber-400 font-bold">₱20</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">1 Week</span><span className="text-amber-400 font-bold">₱60</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">1 Month</span><span className="text-amber-400 font-bold">₱100</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">3 Months</span><span className="text-amber-400 font-bold">₱170</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">6 Months</span><span className="text-amber-400 font-bold">₱220</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">1 Year</span><span className="text-amber-400 font-bold">₱300</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Requests */}
        <section id="subscription-requests" className="space-y-4">
          <h3 className="text-lg font-bold text-white">Subscription Requests</h3>
          {subRequests.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No subscription requests yet.</div>
          ) : (
            <div className="space-y-3">
              {subRequests.map((req) => (
                <div key={req.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{req.user_name}</p>
                      <p className="text-xs text-slate-400">{req.user_email} ({req.user_role})</p>
                      <p className="text-xs text-amber-400 mt-1">Plan: {req.plan.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-500">Ref: {req.reference_number || "N/A"}</p>
                      <p className="text-xs text-slate-500">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${req.status === "approved" ? "bg-green-400/10 text-green-400" : req.status === "rejected" ? "bg-red-400/10 text-red-400" : "bg-amber-400/10 text-amber-400"}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                      {req.status === "pending" && (
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => handleSubscriptionRequest(req.id, true)}
                            className="px-3 py-1 text-xs font-bold text-green-400 border border-green-400/30 rounded hover:bg-green-400/10">
                            Approve
                          </button>
                          <button onClick={() => handleSubscriptionRequest(req.id, false)}
                            className="px-3 py-1 text-xs font-bold text-red-400 border border-red-400/30 rounded hover:bg-red-400/10">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Monthly Payment Requests */}
        <section id="monthly-payments" className="space-y-4">
          <h3 className="text-lg font-bold text-white">Monthly Payment Requests</h3>
          <p className="text-sm text-slate-400">Branch Owners: ₱200/month | Other Branch: ₱250/month</p>
          {monthlyPayments.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No monthly payment requests yet.</div>
          ) : (
            <div className="space-y-3">
              {monthlyPayments.map((payment) => (
                <div key={payment.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{payment.user_name}</p>
                      <p className="text-xs text-slate-400">{payment.user_email} ({payment.user_role})</p>
                      <p className="text-xs text-amber-400 mt-1">₱{payment.amount} for {payment.paid_for_month}</p>
                      <p className="text-xs text-slate-500">Ref: {payment.reference_number || "N/A"}</p>
                      <p className="text-xs text-slate-500">{new Date(payment.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${payment.status === "approved" ? "bg-green-400/10 text-green-400" : payment.status === "rejected" ? "bg-red-400/10 text-red-400" : "bg-amber-400/10 text-amber-400"}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                      {payment.status === "pending" && (
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => handleMonthlyPayment(payment.id, true)}
                            className="px-3 py-1 text-xs font-bold text-green-400 border border-green-400/30 rounded hover:bg-green-400/10">
                            Set Premium
                          </button>
                          <button onClick={() => handleMonthlyPayment(payment.id, false)}
                            className="px-3 py-1 text-xs font-bold text-red-400 border border-red-400/30 rounded hover:bg-red-400/10">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Subscription Timers */}
        <section id="subscription-timers" className="space-y-4">
          <h3 className="text-lg font-bold text-white">Active Subscription Timers</h3>
          {(() => {
            const activeSubscribers = [...branchOwners, ...otherBranches, ...customers].filter((u) => u.isSubscribed);
            if (activeSubscribers.length === 0) {
              return <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No active subscriptions.</div>;
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSubscribers.map((u) => {
                  // Calculate time remaining
                  const getExpiryTime = () => {
                    if (!(u as any).subscriptionExpiry) return "Lifetime";
                    const expiry = new Date((u as any).subscriptionExpiry).getTime();
                    const now = Date.now();
                    const diff = expiry - now;
                    if (diff <= 0) return "Expired";
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
                    if (hours > 0) return `${hours}h ${minutes}m`;
                    return `${minutes}m`;
                  };
                  const getRoleLabel = () => {
                    if (u.role === "branch_owner") return "BO";
                    if (u.role === "other_branch") return "OB";
                    return "C";
                  };
                  return (
                    <div key={u.id} className="glass-card rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-white">{u.fullName}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                        <span className="text-[10px] px-2 py-1 bg-amber-400/10 text-amber-400 rounded-full">{getRoleLabel()}</span>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Time Remaining</p>
                        <p className="text-xl font-bold text-amber-400">{getExpiryTime()}</p>
                        {(u as any).subscriptionExpiry && (
                          <p className="text-[10px] text-slate-500 mt-1">Expires: {new Date((u as any).subscriptionExpiry).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>
      </div>
    </DashboardShell>
  );
}
