"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap } from "@/components/StationMap";
import { SubscriptionCard } from "@/components/SubscriptionCard";

interface Station {
  id: number;
  name: string;
  brand: string;
  ownerId: number | null;
  latitude: number;
  longitude: number;
  address: string;
  isActive: boolean;
  solarWatts: number;
  batteryLevel: number;
  totalSessions: number;
  ownerName: string | null;
  contactNumber: string | null;
}

interface UserData {
  id: number;
  email: string;
  fullName: string;
  role: string;
  contactNumber: string | null;
  address: string | null;
  isSubscribed: boolean;
  subscriptionExpiry: string | null;
  createdAt: string;
}

interface Notification {
  id: number;
  recipientEmail: string;
  subject: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface CompanyUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isSubscribed: boolean;
}

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isSubscribed: boolean;
}

function playClick() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export default function CompanyOwnerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [usersData, setUsersData] = useState<{
    totalUsers: number;
    totalBranchOwners: number;
    totalCustomers: number;
    subscribedBranchOwners: number;
    subscribedCustomers: number;
    users: CompanyUser[];
  } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "stations" | "subscription">("overview");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/stations").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
    ]).then(([userData, stationsData, usersDataRes, notifsData]) => {
      if (userData.user) setUser(userData.user);
      if (stationsData.stations) setStations(stationsData.stations);
      if (usersDataRes.totalUsers !== undefined) setUsersData(usersDataRes);
      if (notifsData.notifications) setNotifications(notifsData.notifications);
    });
  }, []);

  async function toggleStationStatus(station: Station) {
    playClick();
    try {
      await fetch("/api/stations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: station.id, isActive: !station.isActive }),
      });
      setStations((prev) =>
        prev.map((s) => (s.id === station.id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch {
      alert("Error updating station");
    }
  }

  async function seedData() {
    playClick();
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        // Refresh stations
        const stationsRes = await fetch("/api/stations");
        const stationsData = await stationsRes.json();
        if (stationsData.stations) setStations(stationsData.stations);
      }
    } catch {
      alert("Error seeding data");
    }
  }

  function handleSubscribe() {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      });
  }

  const branchOwners = usersData?.users?.filter((u) => u.role === "branch_owner") || [];
  const customers = usersData?.users?.filter((u) => u.role === "customer") || [];

  return (
    <DashboardShell title="Company Owner Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 via-orange-500/5 to-red-500/5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                KLEOXM 111 Management
              </h2>
              <p className="text-slate-400 mt-1">
                Welcome back, {user?.fullName || "Company Owner"}. Monitor your entire PSPCS network.
              </p>
            </div>
            <button
              onClick={seedData}
              className="px-4 py-2 text-xs font-medium text-amber-400 border border-amber-400/30 rounded-lg hover:bg-amber-400/10 transition-all"
            >
              Load Sample Data
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="px-4 py-3 bg-amber-400/10 rounded-lg">
              <div className="text-2xl font-bold text-amber-400">{stations.length}</div>
              <div className="text-xs text-slate-400">Total Stations</div>
            </div>
            <div className="px-4 py-3 bg-green-400/10 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {stations.filter((s) => s.isActive).length}
              </div>
              <div className="text-xs text-slate-400">Active Stations</div>
            </div>
            <div className="px-4 py-3 bg-blue-400/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {usersData?.totalBranchOwners || 0}
              </div>
              <div className="text-xs text-slate-400">Branch Owners</div>
            </div>
            <div className="px-4 py-3 bg-purple-400/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {usersData?.totalCustomers || 0}
              </div>
              <div className="text-xs text-slate-400">Customers</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "overview" as const, label: "Overview" },
            { id: "users" as const, label: "Branch Owners & Customers" },
            { id: "stations" as const, label: "All Stations" },
            { id: "subscription" as const, label: "Subscriptions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playClick();
                setActiveTab(tab.id);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-amber-400 text-[#0f172a]"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6 slide-in">
            {/* Notifications */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">
                Notifications ({notifications.filter((n) => !n.isRead).length} unread)
              </h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No notifications yet. New account signups and subscriptions will appear here.
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg border ${
                        notif.isRead
                          ? "bg-slate-800/50 border-slate-700/50"
                          : "bg-amber-400/5 border-amber-400/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{notif.subject}</p>
                          <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            notif.type === "new_account"
                              ? "bg-blue-400/10 text-blue-400"
                              : "bg-green-400/10 text-green-400"
                          }`}
                        >
                          {notif.type === "new_account" ? "New Account" : "Subscription"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-3">
                📧 All notifications are also sent to earlrey0322@gmail.com
              </p>
            </div>

            {/* GCash Revenue */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">GCash Revenue</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="text-sm text-slate-400">GCash Number</div>
                  <div className="text-xl font-bold text-white">09469086926</div>
                  <div className="text-xs text-slate-500 mt-1">Earl Christian Rey</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Subscribed Branch Owners</div>
                  <div className="text-xl font-bold text-green-400">
                    {usersData?.subscribedBranchOwners || 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">₱50/month each</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Subscribed Customers</div>
                  <div className="text-xl font-bold text-purple-400">
                    {usersData?.subscribedCustomers || 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">₱50/month each</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Payments are directed to GCash: 09469086926 (Earl Christian Rey) when users click upgrade.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">Station Activity</h3>
                <div className="space-y-3">
                  {stations.slice(0, 5).map((station) => (
                    <div
                      key={station.id}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            station.isActive ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        <span className="text-sm text-white">{station.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {station.totalSessions} sessions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">PSPCS Specs</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Solar Panel", value: "Rectifier Bridge Diode" },
                    { label: "DC Output", value: "Battery Charging" },
                    { label: "Inverter", value: "220VAC Output" },
                    { label: "Transformer", value: "12VAC Converter" },
                    { label: "Final Output", value: "3.6VDC Rotary" },
                    { label: "Rate", value: "1 Peso = 5 Min" },
                  ].map((spec) => (
                    <div
                      key={spec.label}
                      className="flex justify-between py-1 border-b border-slate-700/50"
                    >
                      <span className="text-slate-400">{spec.label}</span>
                      <span className="text-amber-400 font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6 slide-in">
            {/* Branch Owners */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">
                Branch Owners ({branchOwners.length})
              </h3>
              {branchOwners.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No branch owners registered yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 text-slate-400 font-medium">Name</th>
                        <th className="text-left py-2 text-slate-400 font-medium">Email</th>
                        <th className="text-left py-2 text-slate-400 font-medium">Subscription</th>
                        <th className="text-left py-2 text-slate-400 font-medium">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchOwners.map((bo) => (
                        <tr key={bo.id} className="border-b border-slate-800">
                          <td className="py-3 text-white">{bo.fullName}</td>
                          <td className="py-3 text-slate-400">{bo.email}</td>
                          <td className="py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                bo.isSubscribed
                                  ? "bg-amber-400/10 text-amber-400"
                                  : "bg-slate-700 text-slate-400"
                              }`}
                            >
                              {bo.isSubscribed ? "★ Premium" : "Free"}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">{(bo as CompanyUser & { contactNumber?: string }).contactNumber || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Customers */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">
                Customers ({customers.length})
              </h3>
              {customers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No customers registered yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 text-slate-400 font-medium">Name</th>
                        <th className="text-left py-2 text-slate-400 font-medium">Email</th>
                        <th className="text-left py-2 text-slate-400 font-medium">Subscription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} className="border-b border-slate-800">
                          <td className="py-3 text-white">{c.fullName}</td>
                          <td className="py-3 text-slate-400">{c.email}</td>
                          <td className="py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                c.isSubscribed
                                  ? "bg-amber-400/10 text-amber-400"
                                  : "bg-slate-700 text-slate-400"
                              }`}
                            >
                              {c.isSubscribed ? "★ Premium" : "Free"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stations Tab */}
        {activeTab === "stations" && (
          <div className="space-y-6 slide-in" id="stations">
            <StationMap
              stations={stations}
              onSelect={(s: Station) => setSelectedStation(s)}
              selectedId={selectedStation?.id}
              showAllBrands={true}
            />

            {/* Manage Stations */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Manage Stations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stations.map((station) => (
                  <div key={station.id} className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{station.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{station.address}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Brand: {station.brand} | {station.solarWatts}W
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            (station.batteryLevel || 0) > 50
                              ? "text-green-400"
                              : "text-amber-400"
                          }`}
                        >
                          {station.batteryLevel || 0}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                      <span className="text-[10px] text-slate-500">
                        {station.totalSessions} sessions
                      </span>
                      <button
                        onClick={() => toggleStationStatus(station)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
                          station.isActive
                            ? "bg-green-400/10 text-green-400 hover:bg-green-400/20"
                            : "bg-red-400/10 text-red-400 hover:bg-red-400/20"
                        }`}
                      >
                        {station.isActive ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === "subscription" && (
          <div className="space-y-6 slide-in" id="subscription">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SubscriptionCard
                role="company_owner"
                isSubscribed={user?.isSubscribed || false}
                onSubscribe={handleSubscribe}
              />

              <div className="space-y-6">
                {/* GCash Details */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-4">GCash Payment Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="text-slate-400">GCash Number</span>
                      <span className="text-white font-bold">09469086926</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="text-slate-400">Account Name</span>
                      <span className="text-white font-bold">Earl Christian Rey</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="text-slate-400">Monthly Fee</span>
                      <span className="text-amber-400 font-bold">₱50.00</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-400">
                      When branch owners or customers click &quot;Upgrade&quot;, they are directed to GCash
                      (09469086926) to pay ₱50/month. Once they confirm payment, their account is
                      upgraded to Premium.
                    </p>
                  </div>
                </div>

                {/* Subscription Stats */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-4">Subscription Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Branch Owner Subscriptions</span>
                        <span className="text-amber-400 font-bold">
                          {usersData?.subscribedBranchOwners || 0}/{usersData?.totalBranchOwners || 0}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full">
                        <div
                          className="h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                          style={{
                            width: `${
                              (usersData?.totalBranchOwners || 0) > 0
                                ? ((usersData?.subscribedBranchOwners || 0) / (usersData?.totalBranchOwners || 1)) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Customer Subscriptions</span>
                        <span className="text-amber-400 font-bold">
                          {usersData?.subscribedCustomers || 0}/{usersData?.totalCustomers || 0}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full">
                        <div
                          className="h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                          style={{
                            width: `${
                              (usersData?.totalCustomers || 0) > 0
                                ? ((usersData?.subscribedCustomers || 0) / (usersData?.totalCustomers || 1)) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-700/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total Subscribers</span>
                        <span className="text-white font-bold">
                          {(usersData?.subscribedBranchOwners || 0) + (usersData?.subscribedCustomers || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-400">Monthly Revenue (Est.)</span>
                        <span className="text-green-400 font-bold">
                          ₱{((usersData?.subscribedBranchOwners || 0) + (usersData?.subscribedCustomers || 0)) * 50}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
