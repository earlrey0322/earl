"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap } from "@/components/StationMap";
import { ChargingCalculator } from "@/components/ChargingCalculator";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { apiFetch } from "@/lib/api-fetch";

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

interface Session {
  id: number;
  phoneBrand: string;
  startBattery: number;
  targetBattery: number;
  costPesos: number;
  durationMinutes: number;
  status: string;
  createdAt: string;
}

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isSubscribed: boolean;
  phoneBrand: string | null;
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
      apiFetch("/api/sessions").then((r) => r.json()),
    ]).then(([userData, stationsData, sessionsData]) => {
      if (userData.user) setUser(userData.user);
      if (stationsData.stations) {
        const filtered = userData.user?.isSubscribed
          ? stationsData.stations
          : stationsData.stations.filter(
              (s: Station) => s.brand === "PSPCS" || s.name.includes("PSPCS")
            );
        setStations(filtered);
      }
      if (sessionsData.sessions) setSessions(sessionsData.sessions);
    });
  }, []);

  async function handleStartSession(data: {
    stationId: number;
    phoneBrand: string;
    startBattery: number;
    targetBattery: number;
    costPesos: number;
    durationMinutes: number;
  }) {
    try {
      const res = await apiFetch("/api/sessions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setSessions((prev) => [result.session, ...prev]);
        alert(
          `Charging session started!\n\nPhone: ${data.phoneBrand}\nFrom: ${data.startBattery}% → ${data.targetBattery}%\nCost: ₱${data.costPesos}\nDuration: ${data.durationMinutes} minutes\n\nDrop ₱${data.costPesos} in the PSPCS unit.`
        );
      }
    } catch {
      alert("Error starting session. Please try again.");
    }
  }

  function handleSubscribe() {
    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      });
  }

  return (
    <DashboardShell title="Customer Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 to-orange-500/5">
          <h2 className="text-2xl font-bold text-white">
            Welcome, {user?.fullName || "Customer"}!
          </h2>
          <p className="text-slate-400 mt-1">
            Find PSPCS charging stations, calculate your charging cost, and start a session.
          </p>
          <div className="flex gap-4 mt-4">
            <div className="px-4 py-2 bg-amber-400/10 rounded-lg">
              <div className="text-lg font-bold text-amber-400">{stations.length}</div>
              <div className="text-xs text-slate-400">Stations Available</div>
            </div>
            <div className="px-4 py-2 bg-green-400/10 rounded-lg">
              <div className="text-lg font-bold text-green-400">
                {stations.filter((s) => s.isActive).length}
              </div>
              <div className="text-xs text-slate-400">Active Now</div>
            </div>
            <div className="px-4 py-2 bg-blue-400/10 rounded-lg">
              <div className="text-lg font-bold text-blue-400">{sessions.length}</div>
              <div className="text-xs text-slate-400">Your Sessions</div>
            </div>
          </div>
        </div>

        {/* Charging Stations Map */}
        <section id="stations">
          <h3 className="text-lg font-bold text-white mb-4">Charging Stations</h3>
          <StationMap
            stations={stations}
            onSelect={(s: Station) => setSelectedStation(s)}
            selectedId={selectedStation?.id}
            showAllBrands={user?.isSubscribed || false}
          />
        </section>

        {/* Calculator & Selected Station */}
        <section id="sessions" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChargingCalculator
            stationId={selectedStation?.id}
            onSessionStart={handleStartSession}
          />

          {/* Recent Sessions */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Recent Sessions</h3>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🔋</div>
                <p className="text-sm text-slate-400">No charging sessions yet</p>
                <p className="text-xs text-slate-500">Select a station and use the calculator to start</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{session.phoneBrand}</p>
                      <p className="text-xs text-slate-400">
                        {session.startBattery}% → {session.targetBattery}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-400">₱{session.costPesos}</p>
                      <p className="text-xs text-slate-500">{session.durationMinutes} min</p>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        session.status === "active"
                          ? "bg-green-400/10 text-green-400"
                          : "bg-slate-600/10 text-slate-400"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Subscription */}
        <section id="subscription">
          <h3 className="text-lg font-bold text-white mb-4">Subscription</h3>
          <div className="max-w-md">
            <SubscriptionCard
              role="customer"
              isSubscribed={user?.isSubscribed || false}
              onSubscribe={handleSubscribe}
            />
          </div>
        </section>

        {/* PSPCS Info */}
        <section className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">About PSPCS Charging</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Rate</span>
                <span className="text-amber-400 font-medium">1 Peso = 5 Minutes</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Output</span>
                <span className="text-amber-400 font-medium">3.6VDC Rotary</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Compatible</span>
                <span className="text-amber-400 font-medium">All Phone Types</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Power Source</span>
                <span className="text-green-400 font-medium">Solar Panel</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">AC Supply</span>
                <span className="text-amber-400 font-medium">220VAC Inverter</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Brand</span>
                <span className="text-amber-400 font-medium">KLEOXM 111 PSPCS</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
