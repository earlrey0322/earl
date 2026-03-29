"use client";

import { useState } from "react";

interface Station {
  id: number; name: string; companyName: string; brand: string;
  ownerId: number | null; ownerName: string | null;
  latitude: number; longitude: number; address: string; location?: string;
  contactNumber: string | null; isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits: number; revenue?: number;
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
  const [viewMap, setViewMap] = useState<Station | null>(null);

  const filtered = stations.filter((s) => {
    if (filter === "active") return s.isActive;
    if (filter === "kleoxm") return s.companyName === "KLEOXM 111";
    return true;
  });

  const validStations = filtered.filter(
    (s) => s.latitude && s.longitude && s.latitude !== 0 && s.longitude !== 0
  );

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

      {viewMap && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <div>
              <h4 className="text-sm font-bold text-white">{viewMap.name}</h4>
              {viewMap.location && <p className="text-[10px] text-green-400">📍 {viewMap.location}</p>}
              <p className="text-[10px] text-slate-400">{viewMap.address}</p>
            </div>
            <button onClick={() => setViewMap(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-600 hover:border-slate-400">
              Close Map
            </button>
          </div>
          <iframe
            title="Station Location"
            width="100%"
            height="400"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.google.com/maps?q=${viewMap.latitude},${viewMap.longitude}&z=16&output=embed`}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {validStations.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelect?.(s)}
            className={`cursor-pointer glass-card rounded-xl p-4 transition-all hover:border-amber-400/50 ${selectedId === s.id ? "border-amber-400 glow-solar" : ""}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-white text-sm">{s.name}</h4>
                <p className={`text-xs font-medium ${s.companyName === "KLEOXM 111" ? "text-blue-400" : "text-yellow-400"}`}>
                  {s.companyName}
                </p>
                {s.location && <p className="text-[10px] text-green-400 mt-0.5">📍 {s.location}</p>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                {s.isActive ? "● Active" : "● Inactive"}
              </span>
            </div>

            <div className="flex items-start gap-2 mb-3">
              <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <div>
                <p className="text-xs text-slate-300">{s.address}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewMap(s);
              }}
              className="w-full py-2.5 text-xs font-bold text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-400/10 flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              View on Map
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`, "_blank");
              }}
              className="w-full mt-1.5 py-2 text-[10px] font-medium text-slate-400 hover:text-white transition-all"
            >
              Open in Google Maps ↗
            </button>
          </div>
        ))}
      </div>

      {validStations.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-2">📍</p>
          <p>No stations found</p>
        </div>
      )}
    </div>
  );
}
