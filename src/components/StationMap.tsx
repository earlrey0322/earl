"use client";

import { useState, useEffect, useCallback } from "react";

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

export function StationMap({
  stations,
  onSelect,
  selectedId,
  showAllBrands = false,
}: {
  stations: Station[];
  onSelect?: (station: Station) => void;
  selectedId?: number;
  showAllBrands?: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "active" | "pspcs">("all");

  const filteredStations = stations.filter((s) => {
    if (filter === "active") return s.isActive;
    if (filter === "pspcs") return s.brand === "PSPCS" || s.name.includes("PSPCS");
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all" as const, label: "All Stations" },
          { value: "active" as const, label: "Active Only" },
          { value: "pspcs" as const, label: "PSPCS Only" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => {
              playClick();
              setFilter(f.value);
            }}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
              filter === f.value
                ? "bg-amber-400 text-[#0f172a]"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
        {!showAllBrands && (
          <span className="px-4 py-1.5 text-xs text-amber-400 bg-amber-400/10 rounded-full">
            ★ Premium to see all brands
          </span>
        )}
      </div>

      {/* Map Visualization */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#1a2332] to-[#0f172a] p-6">
          {/* Philippine Map Approximation */}
          <div className="relative w-full h-[400px] rounded-xl border border-slate-700/50 overflow-hidden bg-[#141d2b]">
            {/* Grid */}
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={`h${i}`} className="absolute w-full border-t border-slate-600" style={{ top: `${i * 10}%` }} />
              ))}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={`v${i}`} className="absolute h-full border-l border-slate-600" style={{ left: `${i * 10}%` }} />
              ))}
            </div>

            {/* Map Label */}
            <div className="absolute top-3 left-3 text-[10px] text-slate-600 font-mono">
              Metro Manila & Surrounding Areas
            </div>

            {/* Station Markers */}
            {filteredStations.map((station, i) => {
              // Map lat/lng to pixel coordinates within Metro Manila area
              const minLat = 14.35, maxLat = 14.75, minLng = 120.9, maxLng = 121.15;
              const x = ((station.longitude - minLng) / (maxLng - minLng)) * 90 + 5;
              const y = ((maxLat - station.latitude) / (maxLat - minLat)) * 85 + 5;

              return (
                <button
                  key={station.id}
                  onClick={() => {
                    playClick();
                    onSelect?.(station);
                  }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all hover:scale-125 ${
                    selectedId === station.id ? "scale-125 z-10" : ""
                  }`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {/* Marker */}
                  <div className={`relative`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg ${
                        station.isActive
                          ? station.brand === "PSPCS" || station.name.includes("PSPCS")
                            ? "bg-amber-400 text-[#0f172a] shadow-amber-400/30"
                            : "bg-green-400 text-[#0f172a] shadow-green-400/30"
                          : "bg-red-400 text-[#0f172a] shadow-red-400/30"
                      }`}
                    >
                      ⚡
                    </div>
                    {station.isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#141d2b] animate-pulse" />
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap">
                      <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl">
                        <p className="font-bold text-white">{station.name}</p>
                        <p className="text-slate-400">{station.address}</p>
                        <p className={station.isActive ? "text-green-400" : "text-red-400"}>
                          {station.isActive ? "● Active" : "● Inactive"}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-3 right-3 bg-[#0f172a]/80 backdrop-blur rounded-lg p-3 text-[10px] space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-400">PSPCS Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-slate-400">Other Brand Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-slate-400">Inactive</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Station List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredStations.map((station) => (
          <button
            key={station.id}
            onClick={() => {
              playClick();
              onSelect?.(station);
            }}
            className={`text-left glass-card rounded-xl p-4 transition-all hover:border-amber-400/50 ${
              selectedId === station.id ? "border-amber-400 glow-solar" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">{station.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{station.address}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      station.isActive
                        ? "bg-green-400/10 text-green-400"
                        : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {station.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {station.solarWatts}W Solar
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {station.totalSessions} sessions
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-lg font-bold ${
                    (station.batteryLevel || 0) > 50
                      ? "text-green-400"
                      : (station.batteryLevel || 0) > 20
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {station.batteryLevel || 0}%
                </div>
                <p className="text-[10px] text-slate-500">Battery</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
