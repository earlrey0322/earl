"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap } from "@/components/StationMap";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { SUBSCRIPTION_PLANS } from "@/lib/store";
import { apiFetch } from "@/lib/api-fetch";

interface Station {
  id: number; name: string; companyName: string; brand: string; ownerId: number | null;
  latitude: number; longitude: number; address: string; isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
  ownerName: string | null; contactNumber: string | null;
}

interface Notification {
  id: number; recipientEmail: string; subject: string; message: string; type: string; isRead: boolean; createdAt: string;
}

interface CompanyUser {
  id: number; email: string; fullName: string; role: string; isSubscribed: boolean;
  subscriptionPlan: string | null; contactNumber: string | null;
}

interface UserData {
  id: number; email: string; fullName: string; role: string; isSubscribed: boolean;
}

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export default function CompanyOwnerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [usersData, setUsersData] = useState<{
    totalUsers: number; totalBranchOwners: number; totalCustomers: number;
    subscribedBranchOwners: number; subscribedCustomers: number; users: CompanyUser[];
  } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/users").then((r) => r.json()),
      apiFetch("/api/notifications").then((r) => r.json()),
    ]).then(([meRes, stRes, usRes, nRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) setUserData(meRes.value.user);
      if (stRes.status === "fulfilled" && stRes.value.stations) setStations(stRes.value.stations);
      if (usRes.status === "fulfilled" && usRes.value.totalUsers !== undefined) setUsersData(usRes.value);
      if (nRes.status === "fulfilled" && nRes.value.notifications) setNotifications(nRes.value.notifications);
    }).catch(() => {});
  }, []);

  async function toggleStation(station: Station) {
    playClick();
    await apiFetch("/api/stations", { method: "PATCH", body: JSON.stringify({ id: station.id, isActive: !station.isActive }) });
    setStations((prev) => prev.map((s) => s.id === station.id ? { ...s, isActive: !s.isActive } : s));
  }

  async function removeSubscription(userId: number) {
    playClick();
    await apiFetch("/api/subscription", { method: "DELETE", body: JSON.stringify({ targetUserId: userId }) });
    if (usersData) setUsersData({ ...usersData, users: usersData.users.map((u) => u.id === userId ? { ...u, isSubscribed: false, subscriptionPlan: null } : u) });
  }

  function handleRefresh() {
    apiFetch("/api/auth/me").then((r) => r.json()).then((d) => { if (d.user) setUserData(d.user); }).catch(() => {});
  }

  const branchOwners = usersData?.users?.filter((u) => u.role === "branch_owner") || [];
  const customers = usersData?.users?.filter((u) => u.role === "customer") || [];

  return (
    <DashboardShell title="Company Owner Dashboard">
      <div className="space-y-8">
        {/* Welcome */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 via-orange-500/5 to-red-500/5">
          <h2 className="text-2xl font-bold text-white">KLEOXM 111 Management</h2>
          <p className="text-slate-400 mt-1">Welcome, {userData?.fullName || "Company Owner"}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="px-4 py-3 bg-amber-400/10 rounded-lg"><div className="text-2xl font-bold text-amber-400">{stations.length}</div><div className="text-xs text-slate-400">Stations</div></div>
            <div className="px-4 py-3 bg-green-400/10 rounded-lg"><div className="text-2xl font-bold text-green-400">{stations.filter((s) => s.isActive).length}</div><div className="text-xs text-slate-400">Active</div></div>
            <div className="px-4 py-3 bg-blue-400/10 rounded-lg"><div className="text-2xl font-bold text-blue-400">{usersData?.totalBranchOwners || 0}</div><div className="text-xs text-slate-400">Branch Owners</div></div>
            <div className="px-4 py-3 bg-purple-400/10 rounded-lg"><div className="text-2xl font-bold text-purple-400">{usersData?.totalCustomers || 0}</div><div className="text-xs text-slate-400">Customers</div></div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Notifications ({notifications.filter((n) => !n.isRead).length} unread)</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No notifications yet.</p>
          ) : (
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

        {/* Users Section */}
        <section id="users" className="space-y-6">
          <h3 className="text-lg font-bold text-white">Branch Owners & Customers</h3>
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Branch Owners ({branchOwners.length})</h4>
            {branchOwners.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No branch owners yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-700"><th className="text-left py-2 text-slate-400">Name</th><th className="text-left py-2 text-slate-400">Email</th><th className="text-left py-2 text-slate-400">Plan</th><th className="text-left py-2 text-slate-400">Action</th></tr></thead>
                  <tbody>
                    {branchOwners.map((u) => (
                      <tr key={u.id} className="border-b border-slate-800">
                        <td className="py-3 text-white">{u.fullName}</td>
                        <td className="py-3 text-slate-400">{u.email}</td>
                        <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.isSubscribed ? "bg-amber-400/10 text-amber-400" : "bg-slate-700 text-slate-400"}`}>{u.isSubscribed ? u.subscriptionPlan || "Premium" : "Free"}</span></td>
                        <td className="py-3">{u.isSubscribed && <button onClick={() => removeSubscription(u.id)} className="text-xs text-red-400 hover:underline">Remove</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Customers ({customers.length})</h4>
            {customers.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No customers yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-700"><th className="text-left py-2 text-slate-400">Name</th><th className="text-left py-2 text-slate-400">Email</th><th className="text-left py-2 text-slate-400">Plan</th><th className="text-left py-2 text-slate-400">Action</th></tr></thead>
                  <tbody>
                    {customers.map((u) => (
                      <tr key={u.id} className="border-b border-slate-800">
                        <td className="py-3 text-white">{u.fullName}</td>
                        <td className="py-3 text-slate-400">{u.email}</td>
                        <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.isSubscribed ? "bg-amber-400/10 text-amber-400" : "bg-slate-700 text-slate-400"}`}>{u.isSubscribed ? u.subscriptionPlan || "Premium" : "Free"}</span></td>
                        <td className="py-3">{u.isSubscribed && <button onClick={() => removeSubscription(u.id)} className="text-xs text-red-400 hover:underline">Remove</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Stations Section */}
        <section id="stations" className="space-y-6">
          <h3 className="text-lg font-bold text-white">All Stations</h3>
          <StationMap stations={stations} onSelect={(s) => setSelectedStation(s)} selectedId={selectedStation?.id} showAllBrands={true} />
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Manage Stations</h4>
            {stations.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No stations.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stations.map((s) => (
                  <div key={s.id} className="bg-slate-800/50 rounded-xl p-4">
                    <h4 className="font-bold text-white text-sm">{s.name}</h4>
                    <p className="text-xs text-amber-400">{s.companyName}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.address}</p>
                    <div className="flex gap-2 mt-2">
                      {s.cableTypeC > 0 && <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">Type-C:{s.cableTypeC}</span>}
                      {s.cableIPhone > 0 && <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">iPhone:{s.cableIPhone}</span>}
                      {s.cableUniversal > 0 && <span className="text-[10px] px-2 py-0.5 bg-slate-500/10 text-slate-400 rounded-full">USB:{s.cableUniversal}</span>}
                      {s.outlets > 0 && <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">Out:{s.outlets}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                      <span className="text-[10px] text-slate-500">{s.totalVisits} visits</span>
                      <button onClick={() => toggleStation(s)} className={`px-3 py-1 text-[10px] font-bold rounded-full ${s.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Subscription Section */}
        <section id="subscription" className="space-y-6">
          <h3 className="text-lg font-bold text-white">Subscriptions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubscriptionCard role="company_owner" isSubscribed={userData?.isSubscribed || false} onSubscribe={handleRefresh} />
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h4 className="font-bold text-white mb-4">GCash Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-700/50"><span className="text-slate-400">Number</span><span className="text-white font-bold">09469086926</span></div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50"><span className="text-slate-400">Name</span><span className="text-white font-bold">Earl Christian Rey</span></div>
                </div>
                <div className="mt-4 space-y-2">
                  {SUBSCRIPTION_PLANS.map((p) => (
                    <div key={p.id} className="flex justify-between py-2 border-b border-slate-700/50 text-sm">
                      <span className="text-slate-400">{p.label}</span><span className="text-amber-400 font-bold">₱{p.price}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h4 className="font-bold text-white mb-4">Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Subscribed Branch Owners</span><span className="text-amber-400 font-bold">{usersData?.subscribedBranchOwners || 0}/{usersData?.totalBranchOwners || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Subscribed Customers</span><span className="text-amber-400 font-bold">{usersData?.subscribedCustomers || 0}/{usersData?.totalCustomers || 0}</span></div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-700/50"><span className="text-slate-400">Total Subscribers</span><span className="text-white font-bold">{(usersData?.subscribedBranchOwners || 0) + (usersData?.subscribedCustomers || 0)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
