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

  function openInGoogleMaps(lat: number, lng: number, name: string) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`, "_blank");
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "active", "kleoxm"] as const).map((f) => (
          <button key={f} onClick={() => { playClick(); setFilter(f); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-full ${filter === f ? "bg-amber-400 text-[#0f172a]" : "bg-slate-800 text-slate-400"}`}>
            {f === "all" ? `All (${stations.length})` : f === "active" ? `Active (${stations.filter(s => s.isActive).length})` : "KLEOXM 111"}
          </button>
        ))}
        {onUseLocation && (
          <button onClick={handleUseMyLocation} className="px-4 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 rounded-full">
            📍 My Location
          </button>
        )}
        {!showAllBrands && <span className="px-4 py-1.5 text-xs text-amber-400 bg-amber-400/10 rounded-full">Premium = All</span>}
      </div>

      {/* Station Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStations.map((station) => (
          <div key={station.id}
            onClick={() => { playClick(); onSelect?.(station); }}
            className={`cursor-pointer glass-card rounded-xl p-5 transition-all hover:border-amber-400/50 ${selectedId === station.id ? "border-amber-400 glow-solar border-2" : "border border-slate-700/50"}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  station.isActive
                    ? station.companyName === "KLEOXM 111" ? "bg-amber-400/20" : "bg-green-400/20"
                    : "bg-red-400/20"
                }`}>
                  📍
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{station.name}</h4>
                  <p className={`text-xs font-medium ${station.companyName === "KLEOXM 111" ? "text-amber-400" : "text-green-400"}`}>
                    {station.companyName}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                station.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
              }`}>
                {station.isActive ? "● Active" : "● Inactive"}
              </span>
            </div>

            {/* Address */}
            <p className="text-xs text-slate-400 mb-3">{station.address}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className={`text-sm font-bold ${(station.batteryLevel || 0) > 50 ? "text-green-400" : "text-amber-400"}`}>{station.batteryLevel || 0}%</div>
                <div className="text-[10px] text-slate-500">Battery</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-blue-400">{station.totalVisits}</div>
                <div className="text-[10px] text-slate-500">Visits</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-amber-400">{station.solarWatts}W</div>
                <div className="text-[10px] text-slate-500">Solar</div>
              </div>
            </div>

            {/* Cables */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {station.cableTypeC > 0 && <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">Type-C: {station.cableTypeC}</span>}
              {station.cableIPhone > 0 && <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">iPhone: {station.cableIPhone}</span>}
              {station.cableUniversal > 0 && <span className="text-[10px] px-2 py-0.5 bg-slate-500/10 text-slate-400 rounded-full">USB: {station.cableUniversal}</span>}
              {station.outlets > 0 && <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">Outlets: {station.outlets}</span>}
            </div>

            {/* Google Maps Link */}
            <button
              onClick={(e) => { e.stopPropagation(); playClick(); openInGoogleMaps(station.latitude, station.longitude, station.name); }}
              className="w-full py-2 text-xs font-medium text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-400/10 transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              Open in Google Maps
            </button>
          </div>
        ))}
      </div>

      {filteredStations.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-2">📍</p>
          <p className="text-sm">No stations found</p>
        </div>
      )}
    </div>
  );
}
