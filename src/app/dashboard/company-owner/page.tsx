"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api-fetch";
import Link from "next/link";

interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; }
interface Notification { id: number; subject: string; message: string; type: string; isRead: boolean; }

interface QuickStats {
  stationsCount: number;
  activeStationsCount: number;
  totalUsers: number;
  totalRevenue: number;
  pendingRequests: number;
}

export default function CompanyOwnerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/notifications").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/users").then((r) => r.json()),
      apiFetch("/api/revenue").then((r) => r.json()),
      apiFetch("/api/subscription-requests").then((r) => r.json()),
      apiFetch("/api/monthly-payments").then((r) => r.json()),
    ]).then(([meR, noR, stR, usR, rvR, srR, mpR]) => {
      if (meR.status === "fulfilled" && meR.value.user) setUserData(meR.value.user);
      if (noR.status === "fulfilled" && noR.value.notifications) setNotifications(noR.value.notifications);

      const stations = stR.status === "fulfilled" && stR.value.stations ? stR.value.stations : [];
      const users = usR.status === "fulfilled" && usR.value.users ? usR.value.users : [];
      const revenue = rvR.status === "fulfilled" && rvR.value.totalRevenue !== undefined ? rvR.value.totalRevenue : 0;
      const subRequests = srR.status === "fulfilled" && srR.value.requests ? srR.value.requests : [];
      const monthlyPayments = mpR.status === "fulfilled" && mpR.value.payments ? mpR.value.payments : [];

      const pendingSub = subRequests.filter((r: any) => r.status === "pending").length;
      const pendingMp = monthlyPayments.filter((p: any) => p.status === "pending").length;

      setStats({
        stationsCount: stations.length,
        activeStationsCount: stations.filter((s: any) => s.isActive).length,
        totalUsers: users.length,
        totalRevenue: revenue,
        pendingRequests: pendingSub + pendingMp,
      });
    }).catch((err) => console.error("Dashboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <DashboardShell title="Company Owner Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Company Owner Dashboard">
      <div className="space-y-8">
        {/* Welcome */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 via-orange-500/5 to-red-500/5">
          <h2 className="text-2xl font-bold text-white">KLEOXM 111 Management</h2>
          <p className="text-slate-400 mt-1">Welcome, {userData?.fullName || "Company Owner"}</p>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/dashboard/company-owner/stations" className="glass-card rounded-xl p-4 hover:border-amber-400/30 transition-colors cursor-pointer">
              <div className="text-2xl font-bold text-amber-400">{stats.stationsCount}</div>
              <div className="text-xs text-slate-400">Total Stations</div>
              <div className="text-[10px] text-amber-400/60 mt-1">{stats.activeStationsCount} active</div>
            </Link>
            <Link href="/dashboard/company-owner/users" className="glass-card rounded-xl p-4 hover:border-blue-400/30 transition-colors cursor-pointer">
              <div className="text-2xl font-bold text-blue-400">{stats.totalUsers}</div>
              <div className="text-xs text-slate-400">Total Users</div>
            </Link>
            <div className="glass-card rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400">₱{stats.totalRevenue}</div>
              <div className="text-xs text-slate-400">Total Revenue</div>
            </div>
            <Link href="/dashboard/company-owner/requests" className="glass-card rounded-xl p-4 hover:border-orange-400/30 transition-colors cursor-pointer">
              <div className="text-2xl font-bold text-orange-400">{stats.pendingRequests}</div>
              <div className="text-xs text-slate-400">Pending Requests</div>
            </Link>
            <div className="glass-card rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-400">{unreadCount}</div>
              <div className="text-xs text-slate-400">Unread Notifications</div>
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/company-owner/stations" className="glass-card rounded-xl p-5 hover:border-amber-400/30 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 font-bold">S</div>
              <div>
                <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">Stations</h3>
                <p className="text-xs text-slate-400">Add, edit, remove stations</p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/company-owner/users" className="glass-card rounded-xl p-5 hover:border-blue-400/30 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center text-blue-400 font-bold">U</div>
              <div>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Users</h3>
                <p className="text-xs text-slate-400">Manage users and premium</p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/company-owner/requests" className="glass-card rounded-xl p-5 hover:border-orange-400/30 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-400/10 flex items-center justify-center text-orange-400 font-bold">R</div>
              <div>
                <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors">Requests</h3>
                <p className="text-xs text-slate-400">Subscriptions, payments, redemptions</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Notifications */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Notifications ({unreadCount} unread)</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No notifications yet.</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {notifications.slice(0, 10).map((n) => (
                <div key={n.id} className={`p-3 rounded-lg border ${n.isRead ? "bg-slate-800/50 border-slate-700/50" : "bg-amber-400/5 border-amber-400/30"}`}>
                  <p className="text-sm font-medium text-white">{n.subject}</p>
                  <p className="text-xs text-slate-400">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
