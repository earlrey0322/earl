"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api-fetch";

interface UserData {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isSubscribed: boolean;
  subscriptionExpiry: string | null;
}

interface QuickStats {
  stations: number;
  activeStations: number;
  sessions: number;
}

export default function CustomerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<QuickStats>({ stations: 0, activeStations: 0, sessions: 0 });
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/sessions").then((r) => r.json()),
    ]).then(([meRes, stRes, hRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) setUserData(meRes.value.user);
      if (stRes.status === "fulfilled" && stRes.value.stations) {
        const stations = stRes.value.stations;
        setStats((prev) => ({
          ...prev,
          stations: stations.length,
          activeStations: stations.filter((s: { isActive: boolean }) => s.isActive).length,
        }));
      }
      if (hRes.status === "fulfilled" && hRes.value.history) {
        setStats((prev) => ({ ...prev, sessions: hRes.value.history.length }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userData?.isSubscribed || !userData?.subscriptionExpiry) return;
    const updateTimer = () => {
      const expiry = new Date(userData.subscriptionExpiry!).getTime();
      const diff = expiry - Date.now();
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

  return (
    <DashboardShell title="Customer Dashboard">
      <div className="space-y-8">
        {/* Welcome Card */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 to-orange-500/5">
          <h2 className="text-2xl font-bold text-white">
            Welcome, {userData?.fullName || "Customer"}!
          </h2>
          <p className="text-slate-400 mt-1">
            Find stations, manage your subscription, and start charging.
          </p>
          <div className="flex gap-4 mt-4">
            <div className="px-4 py-2 bg-amber-400/10 rounded-lg">
              <div className="text-lg font-bold text-amber-400">{stats.stations}</div>
              <div className="text-xs text-slate-400">Stations</div>
            </div>
            <div className="px-4 py-2 bg-green-400/10 rounded-lg">
              <div className="text-lg font-bold text-green-400">{stats.activeStations}</div>
              <div className="text-xs text-slate-400">Active</div>
            </div>
            <div className="px-4 py-2 bg-blue-400/10 rounded-lg">
              <div className="text-lg font-bold text-blue-400">{stats.sessions}</div>
              <div className="text-xs text-slate-400">Sessions</div>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <section className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white">Account Status</h4>
              <p className="text-sm text-slate-400">
                {userData?.isSubscribed
                  ? "You can view all company stations"
                  : "Only KLEOXM 111 stations visible"}
              </p>
            </div>
            {userData?.isSubscribed ? (
              <div className="px-4 py-2 bg-amber-400/10 rounded-lg">
                <span className="text-amber-400 font-bold">★ PREMIUM</span>
                {timeLeft && (
                  <p className="text-[10px] text-slate-400 mt-1">{timeLeft} left</p>
                )}
              </div>
            ) : (
              <div className="px-4 py-2 bg-slate-700 rounded-lg">
                <span className="text-slate-400 font-bold">Regular</span>
              </div>
            )}
          </div>
          {!userData?.isSubscribed && (
            <div className="mt-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
              <p className="text-xs text-amber-400">
                🔒 Premium members can view all company stations. Subscribe to unlock!
              </p>
            </div>
          )}
        </section>

        {/* Navigation Cards */}
        <section>
          <h3 className="text-lg font-bold text-white mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard/customer/stations">
              <div className="glass-card rounded-2xl p-6 hover:border-amber-400/30 border border-transparent transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-400/10 rounded-xl">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Stations</h4>
                    <p className="text-sm text-slate-400">View map, find stations, start charging</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/customer/subscription">
              <div className="glass-card rounded-2xl p-6 hover:border-amber-400/30 border border-transparent transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-400/10 rounded-xl">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Subscription</h4>
                    <p className="text-sm text-slate-400">Manage premium plan, view requests</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
