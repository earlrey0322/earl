"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { RealMap } from "@/components/RealMap";
import { ChargingCalculator } from "@/components/ChargingCalculator";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { SUBSCRIPTION_PLANS } from "@/lib/store";
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

interface Notification { id: number; subject: string; message: string; type: string; isRead: boolean; }

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
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", address: "", latitude: 14.5995, longitude: 120.9842, companyName: "KLEOXM 111", cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1 });

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/sessions").then((r) => r.json()),
      apiFetch("/api/users").then((r) => r.json()),
      apiFetch("/api/notifications").then((r) => r.json()),
    ]).then(([meR, stR, hiR, usR, noR]) => {
      if (meR.status === "fulfilled" && meR.value.user) setUserData(meR.value.user);
      if (stR.status === "fulfilled" && stR.value.stations) setStations(stR.value.stations);
      if (hiR.status === "fulfilled" && hiR.value.history) setHistory(hiR.value.history);
      if (usR.status === "fulfilled" && usR.value.totalUsers !== undefined) setUsersData(usR.value);
      if (noR.status === "fulfilled" && noR.value.notifications) setNotifications(noR.value.notifications);
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

  async function removeSub(userId: number) {
    playClick();
    await apiFetch("/api/subscription", { method: "DELETE", body: JSON.stringify({ targetUserId: userId }) });
    if (usersData) setUsersData({ ...usersData, users: usersData.users.map((u) => u.id === userId ? { ...u, isSubscribed: false } : u) });
  }

  function useLocation() {
    navigator.geolocation.getCurrentPosition((p) => setAddForm((f) => ({ ...f, latitude: p.coords.latitude, longitude: p.coords.longitude })));
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
  const customers = usersData?.users?.filter((u) => u.role === "customer") || [];
  const totalRevenue = history.reduce((s, h) => s + h.costPesos, 0);
  const totalVisits = stations.reduce((s, st) => s + st.totalVisits, 0);

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
                {branchOwners.map((u) => (<tr key={u.id} className="border-b border-slate-800"><td className="py-3 text-white">{u.fullName}</td><td className="py-3 text-slate-400">{u.email}</td><td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.isSubscribed ? "bg-amber-400/10 text-amber-400" : "bg-slate-700 text-slate-400"}`}>{u.isSubscribed ? u.subscriptionPlan || "Premium" : "Free"}</span></td><td className="py-3">{u.isSubscribed && <button onClick={() => removeSub(u.id)} className="text-xs text-red-400 hover:underline">Remove</button>}</td></tr>))}
              </tbody></table></div>
            )}
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Customers ({customers.length})</h4>
            {customers.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">None yet.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-700"><th className="text-left py-2 text-slate-400">Name</th><th className="text-left py-2 text-slate-400">Email</th><th className="text-left py-2 text-slate-400">Plan</th><th className="text-left py-2 text-slate-400">Action</th></tr></thead><tbody>
                {customers.map((u) => (<tr key={u.id} className="border-b border-slate-800"><td className="py-3 text-white">{u.fullName}</td><td className="py-3 text-slate-400">{u.email}</td><td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.isSubscribed ? "bg-amber-400/10 text-amber-400" : "bg-slate-700 text-slate-400"}`}>{u.isSubscribed ? u.subscriptionPlan || "Premium" : "Free"}</span></td><td className="py-3">{u.isSubscribed && <button onClick={() => removeSub(u.id)} className="text-xs text-red-400 hover:underline">Remove</button>}</td></tr>))}
              </tbody></table></div>
            )}
          </div>
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

          <RealMap stations={stations} onSelect={(s) => setSelectedStation(s)} selectedId={selectedStation?.id} showAllBrands={true} onUseLocation={(lat, lng) => setAddForm((p) => ({ ...p, latitude: lat, longitude: lng }))} />

          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-bold text-white mb-4">Manage Stations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map((s) => (
                <div key={s.id} className="bg-slate-800/50 rounded-xl p-4">
                  <h4 className="font-bold text-white text-sm">{s.name}</h4>
                  <p className="text-xs text-amber-400">{s.companyName}</p>
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
                  <div className="bg-green-400/10 rounded-lg p-4"><div className="text-2xl font-bold text-green-400">₱{stations.reduce((s, st) => s + (st.revenue || 0), 0)}</div><div className="text-xs text-slate-400">Station Revenue</div></div>
                  <div className="bg-amber-400/10 rounded-lg p-4"><div className="text-2xl font-bold text-amber-400">₱{history.reduce((s, h) => s + h.costPesos, 0)}</div><div className="text-xs text-slate-400">Charging Revenue</div></div>
                  <div className="bg-blue-400/10 rounded-lg p-4"><div className="text-2xl font-bold text-blue-400">{history.length}</div><div className="text-xs text-slate-400">Total Sessions</div></div>
                  <div className="bg-purple-400/10 rounded-lg p-4"><div className="text-2xl font-bold text-purple-400">{totalVisits}</div><div className="text-xs text-slate-400">Total Visits</div></div>
                </div>
                <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-green-400">Total Revenue</p>
                      <p className="text-xs text-slate-400">Station + Charging combined</p>
                    </div>
                    <p className="text-2xl font-bold text-green-400">₱{stations.reduce((s, st) => s + (st.revenue || 0), 0) + history.reduce((s, h) => s + h.costPesos, 0)}</p>
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
            <SubscriptionCard role="company_owner" isSubscribed={userData?.isSubscribed || false} onSubscribe={handleRefresh} />
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-bold text-white mb-4">Subscription Plans</h4>
              <div className="space-y-2">
                {SUBSCRIPTION_PLANS.map((p) => (
                  <div key={p.id} className="flex justify-between py-2 border-b border-slate-700/50 text-sm">
                    <span className="text-slate-400">{p.label}</span><span className="text-amber-400 font-bold">₱{p.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-slate-400">GCash</span><span className="text-white font-bold">09469086926</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-white">Earl Christian Rey</span></div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Subscribed Branch Owners</span><span className="text-amber-400 font-bold">{usersData?.subscribedBranchOwners || 0}/{usersData?.totalBranchOwners || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Subscribed Customers</span><span className="text-amber-400 font-bold">{usersData?.subscribedCustomers || 0}/{usersData?.totalCustomers || 0}</span></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
