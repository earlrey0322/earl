"use client";

import { useState } from "react";

interface Station {
  id: number; name: string; companyName: string; brand: string; ownerId: number | null;
  latitude: number; longitude: number; address: string; isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits: number; revenue: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
  ownerName: string | null; contactNumber: string | null;
}

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

// Convert lat/lng to percentage position on the map
function latLngToPercent(lat: number, lng: number) {
  const minLat = 14.35, maxLat = 14.75, minLng = 120.85, maxLng = 121.15;
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

export function RealMap({
  stations, onSelect, selectedId, showAllBrands = false, onUseLocation,
}: {
  stations: Station[];
  onSelect?: (station: Station) => void;
  selectedId?: number;
  showAllBrands?: boolean;
  onUseLocation?: (lat: number, lng: number) => void;
}) {
  const [filter, setFilter] = useState<"all" | "active" | "kleoxm">("all");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const filteredStations = stations.filter((s) => {
    if (filter === "active") return s.isActive;
    if (filter === "kleoxm") return s.companyName === "KLEOXM 111";
    return true;
  });

  function handleUseMyLocation() {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { onUseLocation?.(pos.coords.latitude, pos.coords.longitude); },
      () => { alert("Could not get location") }
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "active", "kleoxm"] as const).map((f) => (
          <button key={f} onClick={() => { playClick(); setFilter(f); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-full ${filter === f ? "bg-amber-400 text-[#0f172a]" : "bg-slate-800 text-slate-400"}`}>
            {f === "all" ? "All" : f === "active" ? "Active" : "KLEOXM 111"}
          </button>
        ))}
        {onUseLocation && (
          <button onClick={handleUseMyLocation} className="px-4 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 rounded-full">
            📍 My Location
          </button>
        )}
        {!showAllBrands && <span className="px-4 py-1.5 text-xs text-amber-400 bg-amber-400/10 rounded-full">Premium = All</span>}
      </div>

      {/* Map */}
      <div className="glass-card rounded-2xl overflow-hidden relative" style={{ height: "420px" }}>
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=120.85%2C14.35%2C121.15%2C14.75&layer=mapnik"
          className="w-full h-full border-0"
          title="Station Map"
          loading="lazy"
        />

        {/* Station markers overlay */}
        <div className="absolute inset-0">
          {filteredStations.map((station) => {
            const pos = latLngToPercent(station.latitude, station.longitude);
            const color = !station.isActive ? "#ef4444" : station.companyName === "KLEOXM 111" ? "#f59e0b" : "#22c55e";
            const isSelected = selectedId === station.id;
            const isHovered = hoveredId === station.id;
            return (
              <div key={station.id} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -100%)" }}>
                {/* Pin marker */}
                <button
                  onClick={() => { playClick(); onSelect?.(station); }}
                  onMouseEnter={() => setHoveredId(station.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="relative cursor-pointer"
                  style={{ filter: isSelected ? "drop-shadow(0 0 6px rgba(245,158,11,0.8))" : "none" }}
                >
                  <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
                    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill={color} />
                    <circle cx="14" cy="13" r="6" fill="white" />
                    <text x="14" y="17" textAnchor="middle" fontSize="10" fill={color}>⚡</text>
                  </svg>
                  {station.isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>

                {/* Tooltip on hover */}
                {(isHovered || isSelected) && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52">
                    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl">
                      <p className="font-bold text-white text-sm">{station.name}</p>
                      <p style={{ color }} className="font-medium">{station.companyName}</p>
                      <p className="text-slate-400 mt-1">{station.address}</p>
                      <p className={station.isActive ? "text-green-400" : "text-red-400"}>
                        {station.isActive ? "● Active" : "● Inactive"}
                      </p>
                      <div className="flex gap-2 mt-1 text-slate-500">
                        <span>{station.totalVisits} visits</span>
                        <span>{station.batteryLevel}%</span>
                      </div>
                      {(station.cableTypeC > 0 || station.cableIPhone > 0 || station.cableUniversal > 0) && (
                        <div className="flex gap-1 mt-1">
                          {station.cableTypeC > 0 && <span className="px-1 bg-blue-500/20 text-blue-400 rounded">TC:{station.cableTypeC}</span>}
                          {station.cableIPhone > 0 && <span className="px-1 bg-purple-500/20 text-purple-400 rounded">iP:{station.cableIPhone}</span>}
                          {station.cableUniversal > 0 && <span className="px-1 bg-slate-500/20 text-slate-400 rounded">USB:{station.cableUniversal}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur rounded-lg p-2 text-[10px] space-y-1">
          <div className="flex items-center gap-1.5"><svg width="12" height="16"><path d="M6 0C2.686 0 0 2.686 0 6c0 5.25 6 10 6 10s6-4.75 6-10C12 2.686 9.314 0 6 0z" fill="#f59e0b" /></svg><span className="text-slate-400">KLEOXM</span></div>
          <div className="flex items-center gap-1.5"><svg width="12" height="16"><path d="M6 0C2.686 0 0 2.686 0 6c0 5.25 6 10 6 10s6-4.75 6-10C12 2.686 9.314 0 6 0z" fill="#22c55e" /></svg><span className="text-slate-400">Other</span></div>
          <div className="flex items-center gap-1.5"><svg width="12" height="16"><path d="M6 0C2.686 0 0 2.686 0 6c0 5.25 6 10 6 10s6-4.75 6-10C12 2.686 9.314 0 6 0z" fill="#ef4444" /></svg><span className="text-slate-400">Inactive</span></div>
        </div>
      </div>

      {/* Station List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredStations.map((station) => (
          <button key={station.id} onClick={() => { playClick(); onSelect?.(station); }}
            className={`text-left glass-card rounded-xl p-4 transition-all hover:border-amber-400/50 ${selectedId === station.id ? "border-amber-400 glow-solar" : ""}`}>
            <div className="flex justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">{station.name}</h4>
                <p className="text-xs text-amber-400">{station.companyName}</p>
                <p className="text-xs text-slate-400 mt-1">{station.address}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${station.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>{station.isActive ? "Active" : "Inactive"}</span>
                  <span className="text-[10px] text-slate-500">{station.totalVisits} visits</span>
                  <span className="text-[10px] text-green-400">₱{station.revenue || 0}</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {station.cableTypeC > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">TC:{station.cableTypeC}</span>}
                  {station.cableIPhone > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">iP:{station.cableIPhone}</span>}
                  {station.cableUniversal > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded">USB:{station.cableUniversal}</span>}
                  {station.outlets > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">O:{station.outlets}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-lg font-bold ${(station.batteryLevel || 0) > 50 ? "text-green-400" : "text-amber-400"}`}>{station.batteryLevel || 0}%</div>
                <p className="text-[10px] text-slate-500">Battery</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
