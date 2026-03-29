"use client";

import { useState } from "react";

interface Station {
  id: number; name: string; companyName: string; brand: string; ownerId: number | null;
  latitude: number; longitude: number; address: string; isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
  ownerName: string | null; contactNumber: string | null;
}

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
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
  const [mapLoaded, setMapLoaded] = useState(false);

  const filteredStations = stations.filter((s) => {
    if (filter === "active") return s.isActive;
    if (filter === "kleoxm") return s.companyName === "KLEOXM 111";
    return true;
  });

  // Center: Metro Manila
  const centerLat = 14.5995;
  const centerLng = 120.9842;

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
        {[
          { value: "all" as const, label: "All" },
          { value: "active" as const, label: "Active" },
          { value: "kleoxm" as const, label: "KLEOXM 111" },
        ].map((f) => (
          <button key={f.value} onClick={() => { playClick(); setFilter(f.value); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-full ${filter === f.value ? "bg-amber-400 text-[#0f172a]" : "bg-slate-800 text-slate-400"}`}>
            {f.label}
          </button>
        ))}
        {onUseLocation && (
          <button onClick={handleUseMyLocation} className="px-4 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 rounded-full hover:bg-green-500/20">
            📍 Use My Location
          </button>
        )}
        {!showAllBrands && <span className="px-4 py-1.5 text-xs text-amber-400 bg-amber-400/10 rounded-full">Premium = All Companies</span>}
      </div>

      {/* Map */}
      <div className="glass-card rounded-2xl overflow-hidden" style={{ height: "450px" }}>
        <div className="relative w-full h-full bg-[#1a2332]">
          {/* Leaflet Map */}
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.15}%2C${centerLat - 0.2}%2C${centerLng + 0.15}%2C${centerLat + 0.2}&layer=mapnik&marker=${centerLat}%2C${centerLng}`}
            className="w-full h-full border-0"
            title="Map"
            onLoad={() => setMapLoaded(true)}
          />
          
          {/* Station markers overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {filteredStations.map((station) => {
              const minLat = 14.35, maxLat = 14.75, minLng = 120.9, maxLng = 121.15;
              const x = ((station.longitude - minLng) / (maxLng - minLng)) * 100;
              const y = ((maxLat - station.latitude) / (maxLat - minLat)) * 100;
              if (x < 0 || x > 100 || y < 0 || y > 100) return null;
              return (
                <button key={station.id} onClick={() => { playClick(); onSelect?.(station); }}
                  className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 group transition-all hover:scale-125 z-10 ${selectedId === station.id ? "scale-125" : ""}`}
                  style={{ left: `${x}%`, top: `${y}%` }}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg border-2 ${
                    station.isActive
                      ? station.companyName === "KLEOXM 111" ? "bg-amber-400 border-amber-600 text-[#0f172a]" : "bg-green-400 border-green-600 text-[#0f172a]"
                      : "bg-red-400 border-red-600 text-[#0f172a]"
                  }`}>⚡</div>
                  {station.isActive && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-[#1a2332] animate-pulse" />}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap z-20">
                    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl min-w-[200px]">
                      <p className="font-bold text-white">{station.name}</p>
                      <p className="text-amber-400">{station.companyName}</p>
                      <p className="text-slate-400">{station.address}</p>
                      <p className={station.isActive ? "text-green-400" : "text-red-400"}>{station.isActive ? "● Active" : "● Inactive"}</p>
                      <div className="flex gap-2 mt-1 text-slate-500">
                        {station.cableTypeC > 0 && <span>TC:{station.cableTypeC}</span>}
                        {station.cableIPhone > 0 && <span>iP:{station.cableIPhone}</span>}
                        {station.cableUniversal > 0 && <span>USB:{station.cableUniversal}</span>}
                        {station.outlets > 0 && <span>O:{station.outlets}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 right-3 bg-[#0f172a]/90 backdrop-blur rounded-lg p-2 text-[10px] space-y-1">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400" /><span className="text-slate-400">KLEOXM</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-400" /><span className="text-slate-400">Other</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><span className="text-slate-400">Inactive</span></div>
          </div>
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
                <div className="flex gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${station.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>{station.isActive ? "Active" : "Inactive"}</span>
                  <span className="text-[10px] text-slate-500">{station.totalVisits} visits</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {station.cableTypeC > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">TC:{station.cableTypeC}</span>}
                  {station.cableIPhone > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">iP:{station.cableIPhone}</span>}
                  {station.cableUniversal > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded">USB:{station.cableUniversal}</span>}
                  {station.outlets > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">O:{station.outlets}</span>}
                </div>
              </div>
              <div className="text-right">
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
