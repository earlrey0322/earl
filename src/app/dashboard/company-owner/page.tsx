"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap, Station } from "@/components/StationMap";
import { ChargingCalculator } from "@/components/ChargingCalculator";
import { apiFetch } from "@/lib/api-fetch";

interface Redemption { id: number; user_id: number; user_email: string; user_name: string; redemption_type: string; redemption_label: string; amount: number; status: string; contact_name: string | null; contact_number: string | null; delivery_address: string | null; created_at: string; }

const PLAN_PRICES: Record<string, number> = {
  "1_day": 20,
  "1_week": 60,
  "1_month": 100,
  "3_months": 170,
  "6_months": 220,
  "1_year": 300,
};

const PLAN_DAYS: Record<string, number> = {
  "1_day": 1,
  "1_week": 7,
  "1_month": 30,
  "3_months": 90,
  "6_months": 180,
  "1_year": 365,
};

interface HistoryItem {
  id: number; phoneBrand: string; startBattery: number; targetBattery: number;
  costPesos: number; durationMinutes: number; stationName: string; userEmail: string; createdAt: string;
}

interface Notification { id: number; subject: string; message: string; type: string; isRead: boolean; }

interface SubscriptionRequest { id: number; user_id: number; user_email: string; user_name: string; user_role: string; plan: string; status: string; reference_number: string; created_at: string; subscription_expiry: string | null; }

interface MonthlyPayment { id: number; user_id: number; user_email: string; user_name: string; user_role: string; amount: number; reference_number: string; status: string; paid_for_month: string; created_at: string; }

interface CompanyUser { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; subscriptionPlan: string | null; subscriptionExpiry: string | null; contactNumber?: string | null; }

interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; }

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export default function CompanyOwnerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [usersData, setUsersData] = useState<{ totalUsers: number; totalBranchOwners: number; totalOtherBranches: number; totalCustomers: number; totalCompanyOwners: number; subscribedBranchOwners: number; subscribedOtherBranches: number; subscribedCustomers: number; users: CompanyUser[] } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
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
      apiFetch("/api/redemptions").then((r) => r.json()),
      apiFetch("/api/revenue").then((r) => r.json()),
    ]).then(([meR, stR, hiR, usR, noR, srR, mpR, rdR, rvR]) => {
      if (meR.status === "fulfilled" && meR.value.user) setUserData(meR.value.user);
      if (stR.status === "fulfilled" && stR.value.stations) setStations(stR.value.stations);
      if (hiR.status === "fulfilled" && hiR.value.history) setHistory(hiR.value.history);
      if (usR.status === "fulfilled") {
        if (usR.value.users) setUsersData(usR.value);
      }
      if (noR.status === "fulfilled" && noR.value.notifications) setNotifications(noR.value.notifications);
      if (srR.status === "fulfilled" && srR.value.requests) setSubRequests(srR.value.requests);
      if (mpR.status === "fulfilled" && mpR.value.payments) setMonthlyPayments(mpR.value.payments);
      if (rdR.status === "fulfilled" && rdR.value.redemptions) setRedemptions(rdR.value.redemptions);
      if (rvR.status === "fulfilled" && rvR.value.totalRevenue !== undefined) setTotalRevenue(rvR.value.totalRevenue);
    }).catch((err) => console.error("Dashboard fetch error:", err));
  }, []);

  // Function to refresh users data
  async function refreshUsers() {
    try {
      const res = await apiFetch("/api/users");
      const data = await res.json();
      console.log("Refreshed users:", data);
      if (data.users) setUsersData(data);
    } catch (err) {
      console.error("Error refreshing users:", err);
    }
  }

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
      const res = await apiFetch("/api/admin/users", { method: "PATCH", body: JSON.stringify({ userId, isPremium: makePremium }) });
      const data = await res.json();
      console.log("Toggle premium response:", data);
      if (res.ok) {
        // Update local state
        if (usersData) setUsersData({ 
          ...usersData, 
          users: usersData.users.map((u) => u.id === userId ? { 
            ...u, 
            isSubscribed: makePremium, 
            subscriptionPlan: makePremium ? "lifetime" : null,
            subscriptionExpiry: makePremium ? u.subscriptionExpiry : null 
          } : u) 
        });
        // Also refresh from server to ensure sync
        await refreshUsers();
        alert(makePremium ? "Premium activated!" : "Premium removed - user is now Regular");
      } else {
        alert("Error: " + (data.error || "Failed to update premium"));
      }
    } catch (err) { 
      console.error("Toggle premium error:", err);
      alert("Error: " + String(err)); 
    }
  }

  async function handleSubscriptionRequest(requestId: number, approve: boolean) {
    playClick();
    try {
      const res = await apiFetch("/api/subscription-requests", { method: "PATCH", body: JSON.stringify({ requestId, approve }) });
      const data = await res.json();
      if (res.ok) {
        setSubRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: approve ? "approved" : "rejected" } : r));
        alert(`Request ${approve ? "approved" : "rejected"}!`);
        // Refresh data
        try {
          const [srRes, usRes] = await Promise.all([
            apiFetch("/api/subscription-requests"),
            apiFetch("/api/users"),
          ]);
          const srData = await srRes.json();
          const usData = await usRes.json();
          if (srData.requests) setSubRequests(srData.requests);
          if (usData.totalUsers !== undefined) setUsersData(usData);
        } catch (refreshErr) {
          console.error("Error refreshing:", refreshErr);
        }
      } else {
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (err) { 
      alert("Error: " + String(err)); 
    }
  }

  async function handleMonthlyPayment(paymentId: number, approve: boolean) {
    playClick();
    try {
      const res = await apiFetch("/api/monthly-payments", { method: "PATCH", body: JSON.stringify({ paymentId, approve }) });
      const data = await res.json();
      if (res.ok) {
        setMonthlyPayments((prev) => prev.map((p) => p.id === paymentId ? { ...p, status: approve ? "approved" : "rejected" } : p));
        alert(`Monthly payment ${approve ? "approved" : "rejected"}!`);
        // Refresh data
        try {
          const [mpRes, usRes] = await Promise.all([
            apiFetch("/api/monthly-payments"),
            apiFetch("/api/users"),
          ]);
          const mpData = await mpRes.json();
          const usData = await usRes.json();
          if (mpData.payments) setMonthlyPayments(mpData.payments);
          if (usData.totalUsers !== undefined) setUsersData(usData);
        } catch (refreshErr) {
          console.error("Error refreshing:", refreshErr);
        }
      } else {
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (err) { 
      alert("Error: " + String(err)); 
    }
  }

  async function deleteSubscriptionRequest(requestId: number) {
    playClick();
    if (!confirm("Delete this request?")) return;
    try {
      const res = await apiFetch("/api/subscription-requests", { method: "DELETE", body: JSON.stringify({ requestId }) });
      if (res.ok) {
        setSubRequests((prev) => prev.filter((r) => r.id !== requestId));
        alert("Deleted!");
      }
    } catch (err) { alert("Error: " + String(err)); }
  }

  async function deleteMonthlyPayment(paymentId: number) {
    playClick();
    if (!confirm("Delete this payment request?")) return;
    try {
      const res = await apiFetch("/api/monthly-payments", { method: "DELETE", body: JSON.stringify({ paymentId }) });
      if (res.ok) {
        setMonthlyPayments((prev) => prev.filter((p) => p.id !== paymentId));
        alert("Deleted!");
      }
    } catch (err) { alert("Error: " + String(err)); }
  }

  async function handleRedemption(redemptionId: number, approve: boolean) {
    playClick();
    try {
      const res = await apiFetch("/api/redemptions", { method: "PATCH", body: JSON.stringify({ redemptionId, approve }) });
      if (res.ok) {
        setRedemptions((prev) => prev.map((r) => r.id === redemptionId ? { ...r, status: approve ? "approved" : "rejected" } : r));
        alert(`Redemption ${approve ? "approved" : "rejected"}!`);
      }
    } catch (err) { alert("Error: " + String(err)); }
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

  async function removeStation(id: number, name: string) {
    playClick();
    if (!confirm(`Remove "${name}"?`)) return;
    await apiFetch("/api/stations", { method: "DELETE", body: JSON.stringify({ id }) });
    setStations((prev) => prev.filter((s) => s.id !== id));
  }

  // Get all non-company-owner users
  const allUsers = usersData?.users || [];
  const branchOwnerCount = usersData?.totalBranchOwners || allUsers.filter((u) => u.role === "branch_owner").length;
  const otherBranchCount = usersData?.totalOtherBranches || allUsers.filter((u) => u.role === "other_branch").length;
  const customerCount = usersData?.totalCustomers || allUsers.filter((u) => u.role === "customer").length;
  const companyOwnerCount = usersData?.totalCompanyOwners || 0;
  
  // Get pending requests
  const pendingSubRequests = subRequests.filter((r) => r.status === "pending");
  const pendingMonthlyPayments = monthlyPayments.filter((p) => p.status === "pending");
  
  // Get approved requests with expiry info
  const approvedSubRequests = subRequests.filter((r) => r.status === "approved");
  const approvedMonthlyPayments = monthlyPayments.filter((p) => p.status === "approved");
  
  const subscriptionRevenue = approvedSubRequests.reduce((s, r) => s + (PLAN_PRICES[r.plan] || 0), 0);
  const monthlyPaymentRevenue = approvedMonthlyPayments.reduce((s, p) => s + (p.amount || 0), 0);

  // Calculate time remaining for a user
  function getTimeRemaining(expiry: string | null): string {
    if (!expiry) return "No expiry";
    const exp = new Date(expiry).getTime();
    const now = new Date().getTime();
    const diff = exp - now;
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

  // Get role display name
  function getRoleName(role: string): string {
    switch (role) {
      case "branch_owner": return "Branch Owner";
      case "other_branch": return "Other Branch";
      case "customer": return "Customer";
      default: return role;
    }
  }

  // Get plan display name
  function getPlanName(plan: string | null): string {
    if (!plan) return "";
    return plan.replace(/_/g, " ");
  }

  return (
    <DashboardShell title="Company Owner Dashboard">
      <div className="space-y-8">
        {/* Welcome */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 via-orange-500/5 to-red-500/5">
          <h2 className="text-2xl font-bold text-white">KLEOXM 111 Management</h2>
          <p className="text-slate-400 mt-1">Welcome, {userData?.fullName || "Company Owner"}</p>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mt-4">
            <div className="px-4 py-3 bg-amber-400/10 rounded-lg"><div className="text-2xl font-bold text-amber-400">{stations.length}</div><div className="text-xs text-slate-400">Stations</div></div>
            <div className="px-4 py-3 bg-green-400/10 rounded-lg"><div className="text-2xl font-bold text-green-400">{stations.filter((s) => s.isActive).length}</div><div className="text-xs text-slate-400">Active</div></div>
            <div className="px-4 py-3 bg-orange-400/10 rounded-lg"><div className="text-2xl font-bold text-orange-400">{companyOwnerCount}</div><div className="text-xs text-slate-400">Company Owner</div></div>
            <div className="px-4 py-3 bg-blue-400/10 rounded-lg"><div className="text-2xl font-bold text-blue-400">{branchOwnerCount}</div><div className="text-xs text-slate-400">Branch Owner</div></div>
            <div className="px-4 py-3 bg-purple-400/10 rounded-lg"><div className="text-2xl font-bold text-purple-400">{otherBranchCount}</div><div className="text-xs text-slate-400">Other Station</div></div>
            <div className="px-4 py-3 bg-emerald-400/10 rounded-lg"><div className="text-2xl font-bold text-emerald-400">{customerCount}</div><div className="text-xs text-slate-400">Customer</div></div>
            <div className="px-4 py-3 bg-cyan-400/10 rounded-lg"><div className="text-2xl font-bold text-cyan-400">₱{totalRevenue}</div><div className="text-xs text-slate-400">Revenue</div></div>
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

        {/* Requests Section - Combined */}
        <section id="requests" className="space-y-4">
          <h3 className="text-lg font-bold text-white">Requests</h3>
          
          {/* Pending Requests */}
          {pendingSubRequests.length === 0 && pendingMonthlyPayments.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No pending requests.</div>
          ) : (
            <div className="space-y-3">
              {/* Subscription Requests */}
              {pendingSubRequests.map((req) => (
                <div key={`sub-${req.id}`} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{req.user_name} wants to have a {req.plan.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-400">{req.user_email} ({req.user_role})</p>
                      <p className="text-xs text-slate-500">Ref: {req.reference_number || "N/A"}</p>
                      <p className="text-xs text-slate-500">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSubscriptionRequest(req.id, true)}
                        className="px-4 py-2 text-xs font-bold text-green-400 border border-green-400/30 rounded hover:bg-green-400/10">
                        Accept
                      </button>
                      <button onClick={() => handleSubscriptionRequest(req.id, false)}
                        className="px-4 py-2 text-xs font-bold text-red-400 border border-red-400/30 rounded hover:bg-red-400/10">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Monthly Payment Requests */}
              {pendingMonthlyPayments.map((payment) => (
                <div key={`mp-${payment.id}`} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{payment.user_name} wants to pay monthly fee</p>
                      <p className="text-xs text-slate-400">{payment.user_email} ({payment.user_role})</p>
                      <p className="text-xs text-amber-400">₱{payment.amount} for {payment.paid_for_month}</p>
                      <p className="text-xs text-slate-500">Ref: {payment.reference_number || "N/A"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleMonthlyPayment(payment.id, true)}
                        className="px-4 py-2 text-xs font-bold text-green-400 border border-green-400/30 rounded hover:bg-green-400/10">
                        Approve
                      </button>
                      <button onClick={() => handleMonthlyPayment(payment.id, false)}
                        className="px-4 py-2 text-xs font-bold text-red-400 border border-red-400/30 rounded hover:bg-red-400/10">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Approved Requests (collapsible) */}
          {(approvedSubRequests.length > 0 || approvedMonthlyPayments.length > 0) && (
            <details className="mt-4">
              <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
                View Approved History ({approvedSubRequests.length + approvedMonthlyPayments.length})
              </summary>
              <div className="mt-3 space-y-3">
                {approvedSubRequests.map((req) => (
                  <div key={`approved-sub-${req.id}`} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{req.user_name} - {req.plan.replace(/_/g, " ")}</p>
                        <p className="text-xs text-green-400">Approved</p>
                        {req.subscription_expiry && (
                          <p className="text-xs text-slate-500">Expires: {new Date(req.subscription_expiry).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => togglePremium(req.user_id, false)}
                          className="px-3 py-1 text-xs text-red-400 border border-red-400/30 rounded hover:bg-red-400/10">
                          Remove Premium
                        </button>
                        <button onClick={() => deleteSubscriptionRequest(req.id)}
                          className="px-3 py-1 text-xs text-slate-400 border border-slate-600 rounded hover:bg-slate-700">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {approvedMonthlyPayments.map((payment) => (
                  <div key={`approved-mp-${payment.id}`} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{payment.user_name} - ₱{payment.amount}</p>
                        <p className="text-xs text-green-400">Approved for {payment.paid_for_month}</p>
                      </div>
                      <button onClick={() => deleteMonthlyPayment(payment.id)}
                        className="px-3 py-1 text-xs text-slate-400 border border-slate-600 rounded hover:bg-slate-700">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>

        {/* Redemption Requests */}
        <section id="redemptions" className="space-y-4">
          <h3 className="text-lg font-bold text-white">Redemption Requests</h3>
          <p className="text-sm text-slate-400">1000 pts = Full Station | 500 pts = Parts | 100 pts = 3 Coin Slots | 50 pts = Cable</p>
          {redemptions.filter((r) => r.status === "pending").length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No pending redemptions.</div>
          ) : (
            <div className="space-y-3">
              {redemptions.filter((r) => r.status === "pending").map((r) => (
                <div key={r.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{r.user_name}</p>
                      <p className="text-xs text-slate-400">{r.user_email}</p>
                      <p className="text-xs text-amber-400 mt-1">{r.redemption_label || r.redemption_type} - {r.amount} pts</p>
                      {(r.contact_name || r.delivery_address) && (
                        <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-white">{r.contact_name} - {r.contact_number}</p>
                          <p className="text-xs text-slate-400">{r.delivery_address}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRedemption(r.id, true)}
                        className="px-3 py-1 text-xs font-bold text-green-400 border border-green-400/30 rounded hover:bg-green-400/10">
                        Approve
                      </button>
                      <button onClick={() => handleRedemption(r.id, false)}
                        className="px-3 py-1 text-xs font-bold text-red-400 border border-red-400/30 rounded hover:bg-red-400/10">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* All Users Timeline */}
        <section id="users-timeline" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">All Users ({allUsers.length})</h3>
              <p className="text-sm text-slate-400">All registered users with email, phone, and status.</p>
            </div>
            <button onClick={() => { refreshUsers(); }}
              className="px-4 py-2 text-xs font-medium text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-400/10">
              Refresh Users
            </button>
          </div>
          {allUsers.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No users yet. Users will appear here when they sign up.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400">Email</th>
                    <th className="text-left py-2 text-slate-400">Phone</th>
                    <th className="text-left py-2 text-slate-400">Role</th>
                    <th className="text-left py-2 text-slate-400">Status</th>
                    <th className="text-left py-2 text-slate-400">Time Remaining</th>
                    <th className="text-left py-2 text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800">
                      <td className="py-3 text-white font-medium">{u.email}</td>
                      <td className="py-3 text-slate-300">{(u as any).contactNumber || "N/A"}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          u.role === "branch_owner" ? "bg-blue-400/10 text-blue-400" :
                          u.role === "other_branch" ? "bg-purple-400/10 text-purple-400" :
                          "bg-green-400/10 text-green-400"
                        }`}>
                          {u.role === "branch_owner" ? "Branch Owner" :
                           u.role === "other_branch" ? "Other Branch" : "Customer"}
                        </span>
                      </td>
                      <td className="py-3">
                        {u.isSubscribed ? (
                          <span className="text-xs px-2 py-1 bg-amber-400/10 text-amber-400 rounded-full font-bold">
                            ★ Premium
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-full">
                            Regular
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {u.isSubscribed && u.subscriptionExpiry ? (
                          <span className={`text-xs ${getTimeRemaining(u.subscriptionExpiry) === "Expired" ? "text-red-400" : "text-amber-400"}`}>
                            {u.subscriptionPlan && <span className="font-bold">{getPlanName(u.subscriptionPlan)} - </span>}
                            {getTimeRemaining(u.subscriptionExpiry)}
                          </span>
                        ) : u.isSubscribed ? (
                          <span className="text-xs text-amber-400 font-bold">Lifetime</span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => togglePremium(u.id, !u.isSubscribed)}
                          className={`text-xs px-3 py-1 rounded font-bold ${
                            u.isSubscribed 
                              ? "bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/30" 
                              : "bg-green-400/10 text-green-400 hover:bg-green-400/20 border border-green-400/30"
                          }`}
                        >
                          {u.isSubscribed ? "Unset Premium" : "Set Premium"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
        </section>

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

        {/* Charging Calculator */}
        <section id="sessions" className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">PSPCS-based Calculator</h3>
          {selectedStation && <p className="text-sm text-amber-400 mb-2">Selected Station: {selectedStation.name}</p>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChargingCalculator stationId={selectedStation?.id} stationName={selectedStation?.name} />
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">PSPCS Specs</h3>
              <div className="space-y-2 text-sm">
                {[{ l: "Output", v: "3.6VDC" }, { l: "Cables", v: "All Types" }, { l: "Power", v: "Solar" }, { l: "AC", v: "220VAC" }, { l: "Brand", v: "KLEOXM 111" }].map((s) => (
                  <div key={s.l} className="flex justify-between py-2 border-b border-slate-700/50"><span className="text-slate-400">{s.l}</span><span className="text-amber-400 font-medium">{s.v}</span></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Revenue */}
        <section id="revenue" className="space-y-4">
          <h3 className="text-lg font-bold text-white">Revenue</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4"><div className="text-2xl font-bold text-blue-400">₱{subscriptionRevenue}</div><div className="text-xs text-slate-400">Subscriptions</div></div>
            <div className="glass-card rounded-xl p-4"><div className="text-2xl font-bold text-purple-400">₱{monthlyPaymentRevenue}</div><div className="text-xs text-slate-400">Monthly Payments</div></div>
          </div>
          <div className="glass-card rounded-xl p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-green-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">₱{totalRevenue}</p>
            </div>
          </div>
        </section>

        {/* Pricing Info */}
        <section className="glass-card rounded-2xl p-6">
          <h4 className="font-bold text-white mb-4">GCash Payment Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">GCash</span><span className="text-white font-bold">09469086926</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-white">Earl Christian Rey</span></div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Subscription Plans</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">1 Day</span><span className="text-amber-400 font-bold">₱20</span></div>
              <div className="flex justify-between"><span className="text-slate-400">1 Week</span><span className="text-amber-400 font-bold">₱60</span></div>
              <div className="flex justify-between"><span className="text-slate-400">1 Month</span><span className="text-amber-400 font-bold">₱100</span></div>
              <div className="flex justify-between"><span className="text-slate-400">3 Months</span><span className="text-amber-400 font-bold">₱170</span></div>
              <div className="flex justify-between"><span className="text-slate-400">6 Months</span><span className="text-amber-400 font-bold">₱220</span></div>
              <div className="flex justify-between"><span className="text-slate-400">1 Year</span><span className="text-amber-400 font-bold">₱300</span></div>
            </div>
            <h5 className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Monthly Fees</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Branch Owner</span><span className="text-amber-400 font-bold">₱75/month</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Other Branch</span><span className="text-amber-400 font-bold">₱100/month</span></div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
