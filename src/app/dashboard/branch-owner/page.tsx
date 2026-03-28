"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { StationMap } from "@/components/StationMap";
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

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isSubscribed: boolean;
  contactNumber: string | null;
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

function playSuccess() {
  try {
    const ctx = new AudioContext();
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  } catch {}
}

export default function BranchOwnerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStation, setNewStation] = useState({
    name: "",
    address: "",
    latitude: 14.5995,
    longitude: 120.9842,
    contactNumber: "",
  });

  useEffect(() => {
    Promise.all([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/stations").then((r) => r.json()),
    ]).then(([userData, stationsData]) => {
      if (userData.user) setUser(userData.user);
      if (stationsData.stations) setStations(stationsData.stations);
    });
  }, []);

  async function toggleStationStatus(station: Station) {
    playClick();
    try {
      await apiFetch("/api/stations", {
        method: "PATCH",
        body: JSON.stringify({ id: station.id, isActive: !station.isActive }),
      });
      setStations((prev) =>
        prev.map((s) => (s.id === station.id ? { ...s, isActive: !s.isActive } : s))
      );
      playSuccess();
    } catch {
      alert("Error updating station");
    }
  }

  async function addStation() {
    playClick();
    try {
      const res = await apiFetch("/api/stations", {
        method: "POST",
        body: JSON.stringify({
          ...newStation,
          contactNumber: newStation.contactNumber || user?.contactNumber,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStations((prev) => [...prev, data.station]);
        setShowAddStation(false);
        setNewStation({
          name: "",
          address: "",
          latitude: 14.5995,
          longitude: 120.9842,
          contactNumber: "",
        });
        playSuccess();
      }
    } catch {
      alert("Error adding station");
    }
  }

  function handleSubscribe() {
    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      });
  }

  const myStations = stations.filter((s) => s.ownerId === user?.id);
  const allPSPCS = stations.filter((s) => s.brand === "PSPCS" || s.name.includes("PSPCS"));

  return (
    <DashboardShell title="Branch Owner Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-green-400/10 to-emerald-500/5">
          <h2 className="text-2xl font-bold text-white">
            Welcome, {user?.fullName || "Station Owner"}!
          </h2>
          <p className="text-slate-400 mt-1">
            Manage your PSPCS charging stations, add map markers, and monitor performance.
          </p>
          <div className="flex gap-4 mt-4">
            <div className="px-4 py-2 bg-green-400/10 rounded-lg">
              <div className="text-lg font-bold text-green-400">{myStations.length}</div>
              <div className="text-xs text-slate-400">Your Stations</div>
            </div>
            <div className="px-4 py-2 bg-amber-400/10 rounded-lg">
              <div className="text-lg font-bold text-amber-400">
                {myStations.filter((s) => s.isActive).length}
              </div>
              <div className="text-xs text-slate-400">Active</div>
            </div>
            <div className="px-4 py-2 bg-blue-400/10 rounded-lg">
              <div className="text-lg font-bold text-blue-400">
                {myStations.reduce((sum, s) => sum + (s.totalSessions || 0), 0)}
              </div>
              <div className="text-xs text-slate-400">Total Sessions</div>
            </div>
          </div>
        </div>

        {/* Add Station Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Your Stations</h3>
          <button
            onClick={() => {
              playClick();
              setShowAddStation(!showAddStation);
            }}
            className="px-4 py-2 text-sm font-medium text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg hover:shadow-lg transition-all"
          >
            + Add Station
          </button>
        </div>

        {/* Add Station Form */}
        {showAddStation && (
          <div className="glass-card rounded-2xl p-6 slide-in">
            <h4 className="font-bold text-white mb-4">Add New Station</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Station Name</label>
                <input
                  type="text"
                  value={newStation.name}
                  onChange={(e) => setNewStation((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-400 transition-colors"
                  placeholder="e.g. PSPCS Station - Marikina"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={newStation.address}
                  onChange={(e) => setNewStation((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-400 transition-colors"
                  placeholder="Full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newStation.latitude}
                  onChange={(e) => setNewStation((p) => ({ ...p, latitude: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newStation.longitude}
                  onChange={(e) => setNewStation((p) => ({ ...p, longitude: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Contact Number</label>
                <input
                  type="tel"
                  value={newStation.contactNumber}
                  onChange={(e) => setNewStation((p) => ({ ...p, contactNumber: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-400 transition-colors"
                  placeholder="09XXXXXXXXX"
                />
              </div>
              <div className="flex items-end gap-3">
                <button
                  onClick={addStation}
                  disabled={!newStation.name || !newStation.address}
                  className="flex-1 py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg disabled:opacity-50 hover:shadow-lg transition-all"
                >
                  Add Station
                </button>
                <button
                  onClick={() => {
                    playClick();
                    setShowAddStation(false);
                  }}
                  className="px-4 py-3 text-sm text-slate-400 border border-slate-600 rounded-lg hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Stations List */}
        {myStations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myStations.map((station) => (
              <div key={station.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{station.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{station.address}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        (station.batteryLevel || 0) > 50 ? "text-green-400" : "text-amber-400"
                      }`}
                    >
                      {station.batteryLevel || 0}%
                    </div>
                    <p className="text-[10px] text-slate-500">Battery</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                  <div className="flex gap-2">
                    <span className="text-[10px] text-slate-500">{station.solarWatts}W Solar</span>
                    <span className="text-[10px] text-slate-500">{station.totalSessions} sessions</span>
                  </div>
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
        )}

        {/* All PSPCS Stations Map */}
        <section id="stations">
          <h3 className="text-lg font-bold text-white mb-4">All PSPCS Stations</h3>
          <StationMap
            stations={allPSPCS}
            onSelect={(s: Station) => setSelectedStation(s)}
            selectedId={selectedStation?.id}
            showAllBrands={user?.isSubscribed || false}
          />
        </section>

        {/* Subscription */}
        <section id="subscription">
          <h3 className="text-lg font-bold text-white mb-4">Subscription</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubscriptionCard
              role="branch_owner"
              isSubscribed={user?.isSubscribed || false}
              onSubscribe={handleSubscribe}
            />
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">GCash Payment Info</h3>
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
                <p className="text-xs text-slate-500 mt-3">
                  Click the upgrade button to activate premium. You&apos;ll be redirected to GCash for payment.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
