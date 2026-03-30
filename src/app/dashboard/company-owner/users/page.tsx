"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api-fetch";

interface CompanyUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  subscriptionExpiry: string | null;
  contactNumber?: string | null;
}

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

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

function getPlanName(plan: string | null): string {
  if (!plan) return "";
  return plan.replace(/_/g, " ");
}

export default function UsersPage() {
  const [usersData, setUsersData] = useState<{
    totalUsers: number;
    totalBranchOwners: number;
    totalOtherBranches: number;
    totalCustomers: number;
    totalCompanyOwners: number;
    subscribedBranchOwners: number;
    subscribedOtherBranches: number;
    subscribedCustomers: number;
    users: CompanyUser[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsersData(data);
      })
      .catch((err) => console.error("Users fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  async function refreshUsers() {
    try {
      const res = await apiFetch("/api/users");
      const data = await res.json();
      if (data.users) setUsersData(data);
    } catch (err) {
      console.error("Error refreshing users:", err);
    }
  }

  async function togglePremium(userId: number, makePremium: boolean) {
    playClick();
    try {
      const res = await apiFetch("/api/admin/users", { method: "PATCH", body: JSON.stringify({ userId, isPremium: makePremium }) });
      const data = await res.json();
      if (res.ok) {
        if (usersData) setUsersData({
          ...usersData,
          users: usersData.users.map((u) => u.id === userId ? {
            ...u,
            isSubscribed: makePremium,
            subscriptionPlan: makePremium ? "lifetime" : null,
            subscriptionExpiry: makePremium ? u.subscriptionExpiry : null
          } : u)
        });
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

  const allUsers = usersData?.users || [];
  const branchOwnerCount = usersData?.totalBranchOwners || allUsers.filter((u) => u.role === "branch_owner").length;
  const otherBranchCount = usersData?.totalOtherBranches || allUsers.filter((u) => u.role === "other_branch").length;
  const customerCount = usersData?.totalCustomers || allUsers.filter((u) => u.role === "customer").length;
  const companyOwnerCount = usersData?.totalCompanyOwners || 0;

  if (loading) {
    return (
      <DashboardShell title="Users Management">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Loading users...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Users Management">
      <div className="space-y-8">
        {/* Stats */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">All Users</h2>
            <button onClick={() => { refreshUsers(); }}
              className="px-4 py-2 text-xs font-medium text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-400/10">
              Refresh Users
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="px-4 py-3 bg-blue-400/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{branchOwnerCount}</div>
              <div className="text-xs text-slate-400">Branch Owners</div>
            </div>
            <div className="px-4 py-3 bg-purple-400/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{otherBranchCount}</div>
              <div className="text-xs text-slate-400">Other Stations</div>
            </div>
            <div className="px-4 py-3 bg-green-400/10 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{customerCount}</div>
              <div className="text-xs text-slate-400">Customers</div>
            </div>
            <div className="px-4 py-3 bg-amber-400/10 rounded-lg">
              <div className="text-2xl font-bold text-amber-400">{allUsers.filter((u) => u.isSubscribed).length}</div>
              <div className="text-xs text-slate-400">Premium Users</div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {allUsers.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No users yet. Users will appear here when they sign up.</div>
        ) : (
          <div className="glass-card rounded-2xl p-6 overflow-x-auto">
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
                          Premium
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
      </div>
    </DashboardShell>
  );
}
