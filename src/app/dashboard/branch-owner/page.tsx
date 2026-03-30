"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api-fetch";
import Link from "next/link";

interface MonthlyPayment { id: number; amount: number; reference_number: string; status: string; paid_for_month: string; created_at: string; }
interface UserData { id: number; email: string; fullName: string; role: string; isSubscribed: boolean; contactNumber: string | null; subscriptionExpiry: string | null; }
interface Station { id: number; name: string; address: string; isActive: boolean; views: number; viewRevenue: number; ownerId: number; }

export default function BranchOwnerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/monthly-payments").then((r) => r.json()),
    ]).then(([meRes, stRes, mpRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) {
        setUserData(meRes.value.user);
      }
      if (stRes.status === "fulfilled" && stRes.value.stations) {
        setStations(stRes.value.stations);
      }
      if (mpRes.status === "fulfilled" && mpRes.value.payments) setMonthlyPayments(mpRes.value.payments);
    }).catch(() => {});
  }, []);

  const myStations = stations.filter((s) => Number(s.ownerId) === Number(userData?.id));
  const activeStations = myStations.filter((s) => s.isActive);
  const totalViews = myStations.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalViewRevenue = myStations.reduce((sum, s) => sum + (s.viewRevenue || 0), 0);
  const monthlyFee = userData?.role === "other_branch" ? 100 : 75;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthPayment = monthlyPayments.find((p) => p.paid_for_month === currentMonth && p.status === "approved");

  return (
    <DashboardShell title="Branch Owner Dashboard">
      <div className="space-y-8">
        {/* Welcome Card */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-green-400/10 to-emerald-500/5">
          <h2 className="text-2xl font-bold text-white">Welcome, {userData?.fullName || "Station Owner"}!</h2>
          <p className="text-slate-400 mt-1">Manage your PSPCS stations.</p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="px-4 py-3 bg-green-400/10 rounded-lg">
              <div className="text-lg font-bold text-green-400">{myStations.length}</div>
              <div className="text-xs text-slate-400">My Stations</div>
            </div>
            <div className="px-4 py-3 bg-amber-400/10 rounded-lg">
              <div className="text-lg font-bold text-amber-400">{activeStations.length}</div>
              <div className="text-xs text-slate-400">Active Stations</div>
            </div>
            <div className="px-4 py-3 bg-blue-400/10 rounded-lg">
              <div className="text-lg font-bold text-blue-400">{totalViews}</div>
              <div className="text-xs text-slate-400">Total Views</div>
            </div>
            <div className="px-4 py-3 bg-purple-400/10 rounded-lg">
              <div className="text-lg font-bold text-purple-400">{totalViewRevenue.toFixed(1)}</div>
              <div className="text-xs text-slate-400">Points</div>
            </div>
          </div>
        </div>

        {/* Monthly Payment Status */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">Monthly Fee Status</h3>
              <p className="text-sm text-slate-400">
                {currentMonthPayment
                  ? `✅ Paid for ${currentMonth}`
                  : `⏳ ${currentMonth} payment pending - ₱${monthlyFee}`}
              </p>
            </div>
            <Link href="/dashboard/branch-owner/subscription"
              className="px-4 py-2 text-sm font-medium text-amber-400 border border-amber-400/30 rounded-lg hover:bg-amber-400/10">
              Manage Payments
            </Link>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/branch-owner/stations" className="glass-card rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
            <div className="text-3xl mb-3">🏪</div>
            <h3 className="font-bold text-white">My Stations</h3>
            <p className="text-sm text-slate-400 mt-1">Add, edit, and manage your charging stations</p>
            <div className="mt-3 text-xs text-green-400">{myStations.length} stations · {activeStations.length} active</div>
          </Link>

          <Link href="/dashboard/branch-owner/subscription" className="glass-card rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
            <div className="text-3xl mb-3">💳</div>
            <h3 className="font-bold text-white">Subscription</h3>
            <p className="text-sm text-slate-400 mt-1">Monthly payments, points, and redemptions</p>
            <div className="mt-3 text-xs text-amber-400">{totalViewRevenue.toFixed(1)} points available</div>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
