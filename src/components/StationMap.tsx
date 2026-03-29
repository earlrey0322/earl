"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

interface Station {
  id: number; name: string; companyName: string; brand: string;
  ownerId: number | null; ownerName: string | null;
  latitude: number; longitude: number; address: string;
  contactNumber: string | null; isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits: number; revenue?: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
}

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-[#0f172a] rounded-2xl">
      <div className="text-center">
        <div className="text-2xl mb-2">🌍</div>
        <div className="text-slate-400 text-sm">Loading map...</div>
      </div>
    </div>
  ),
});

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

  const filtered = stations.filter((s) => {
    if (filter === "active") return s.isActive;
    if (filter === "kleoxm") return s.companyName === "KLEOXM 111";
    return true;
  });

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

      <div className="glass-card rounded-2xl overflow-hidden">
        <LeafletMap stations={filtered} onSelect={onSelect} />
        <div className="flex gap-4 px-4 py-3 border-t border-slate-700/50 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-green-500" />
            <span className="text-[10px] text-slate-400">KLEOXM Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-red-500" />
            <span className="text-[10px] text-slate-400">KLEOXM Inactive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-green-500" />
            <span className="text-[10px] text-slate-400">Premium Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-red-500" />
            <span className="text-[10px] text-slate-400">Premium Inactive</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect?.(s)}
            className={`text-left glass-card rounded-xl p-4 transition-all hover:border-amber-400/50 ${selectedId === s.id ? "border-amber-400 glow-solar" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">{s.name}</h4>
                <p className={`text-xs font-medium ${s.companyName === "KLEOXM 111" ? "text-blue-400" : "text-yellow-400"}`}>{s.companyName}</p>
                <p className="text-xs text-slate-400 mt-1">{s.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] text-slate-500">{s.totalVisits} visits</span>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {s.cableTypeC > 0 && <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">Type-C: {s.cableTypeC}</span>}
                  {s.cableIPhone > 0 && <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">iPhone: {s.cableIPhone}</span>}
                  {s.cableUniversal > 0 && <span className="text-[10px] px-2 py-0.5 bg-slate-500/10 text-slate-400 rounded-full">USB: {s.cableUniversal}</span>}
                  {s.outlets > 0 && <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">Outlets: {s.outlets}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${(s.batteryLevel || 0) > 50 ? "text-green-400" : (s.batteryLevel || 0) > 20 ? "text-amber-400" : "text-red-400"}`}>
                  {s.batteryLevel || 0}%
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
