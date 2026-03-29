"use client";

import { useState } from "react";

export interface Station {
  id: number; name: string; companyName: string; brand: string;
  ownerId: number | null; ownerName: string | null;
  latitude: number; longitude: number; address: string; location?: string;
  isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits?: number; views?: number; viewRevenue?: number; revenue?: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
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
  const [filter, setFilter] = useState<"all" | "active" | "kleoxm">("all");
  const [selected, setSelected] = useState<Station | null>(null);

  const filtered = stations.filter((s) => {
    if (filter === "active") return s.isActive;
    if (filter === "kleoxm") return s.companyName === "KLEOXM 111";
    return true;
  });

  const validStations = filtered.filter(
    (s) => s.latitude && s.longitude && s.latitude !== 0 && s.longitude !== 0
  );

  const handleSelect = (s: Station) => {
    setSelected(s);
    onSelect?.(s);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["all", "active", "kleoxm"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
              filter === f ? "bg-amber-400 text-[#0f172a]" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}>
            {f === "all" ? `All (${stations.length})` : f === "active" ? `Active (${stations.filter(s => s.isActive).length})` : "KLEOXM 111"}
          </button>
        ))}
        {!showAllBrands && (
          <span className="px-4 py-1.5 text-xs text-amber-400 bg-amber-400/10 rounded-full">Premium = All</span>
        )}
      </div>

      {/* Station List + Map Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Station Cards */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {validStations.map((s) => (
            <div
              key={s.id}
              onClick={() => handleSelect(s)}
              className={`cursor-pointer glass-card rounded-xl p-4 transition-all ${
                selected?.id === s.id ? "border-2 border-amber-400 glow-solar" : "border border-slate-700/50 hover:border-amber-400/50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-white text-sm">{s.name}</h4>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                  {s.isActive ? "Active" : "Offline"}
                </span>
              </div>

              {s.ownerName && (
                <p className="text-[11px] text-slate-400 mb-1">
                  <span className="text-slate-500">Owner:</span> {s.ownerName}
                </p>
              )}

              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3 h-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <p className="text-[10px] text-slate-500">{s.latitude.toFixed(6)}, {s.longitude.toFixed(6)}</p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-blue-400">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                Showing on map
              </div>

              {(s.cableTypeC > 0 || s.cableIPhone > 0 || s.cableUniversal > 0) && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {s.cableTypeC > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">Type-C: {s.cableTypeC}</span>}
                  {s.cableIPhone > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">iPhone: {s.cableIPhone}</span>}
                  {s.cableUniversal > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded">USB: {s.cableUniversal}</span>}
                </div>
              )}
            </div>
          ))}

          {validStations.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-2">📍</p>
              <p>No stations found</p>
            </div>
          )}
        </div>

        {/* Right: Google Map */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {selected ? (
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-slate-700/50 bg-[#1e293b]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{selected.name}</h4>
                    <p className="text-[10px] text-slate-400">{selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${selected.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                    {selected.isActive ? "Active" : "Offline"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-h-[400px]">
                <iframe
                  title="Station Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 400 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${selected.latitude},${selected.longitude}&z=17&output=embed&iwloc`}
                />
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center bg-[#0f172a]">
              <div className="text-center text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <p className="text-sm">Select a station to view on map</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Station Details Panel (shown when selected) */}
      {selected && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{selected.name}</h3>
              <p className={`text-sm font-medium ${selected.companyName === "KLEOXM 111" ? "text-blue-400" : "text-yellow-400"}`}>
                {selected.companyName}
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${selected.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
              {selected.isActive ? "● Active" : "● Inactive"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {selected.ownerName && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Owner</p>
                  <p className="text-sm text-white">{selected.ownerName}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Location</p>
                <p className="text-sm text-white">{selected.address}</p>
                {selected.location && <p className="text-xs text-green-400 mt-0.5">📍 {selected.location}</p>}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Coordinates</p>
                <p className="text-sm text-slate-300">{selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Available Cables</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {selected.cableTypeC > 0 && <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg">Type-C: {selected.cableTypeC}</span>}
                  {selected.cableIPhone > 0 && <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg">iPhone: {selected.cableIPhone}</span>}
                  {selected.cableUniversal > 0 && <span className="text-xs px-2 py-1 bg-slate-500/10 text-slate-400 rounded-lg">USB: {selected.cableUniversal}</span>}
                  {selected.outlets > 0 && <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg">Outlets: {selected.outlets}</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{selected.batteryLevel || 0}%</div>
                  <div className="text-[10px] text-slate-500">Battery</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">{selected.totalVisits}</div>
                  <div className="text-[10px] text-slate-500">Visits</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.open(`https://www.google.com/maps/@${selected.latitude},${selected.longitude},17z`, "_blank")}
            className="w-full mt-4 py-3 text-sm font-bold text-blue-400 border border-blue-400/30 rounded-xl hover:bg-blue-400/10 flex items-center justify-center gap-2 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Open in Google Maps
          </button>
        </div>
      )}
    </div>
  );
}
