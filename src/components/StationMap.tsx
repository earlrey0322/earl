"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-fetch";

export interface Station {
  id: number; name: string; companyName: string; brand: string;
  ownerId: number | null; ownerName: string | null;
  latitude: number; longitude: number; address: string; location?: string;
  isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits?: number; views?: number; viewRevenue?: number; revenue?: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
  distanceKm?: number;
}

type FilterType = "all" | "active" | "inactive" | "kleoxm" | "other";

export function StationMap({
  stations,
  onSelect,
  selectedId,
  isPremium = false,
}: {
  stations: Station[];
  onSelect?: (station: Station) => void;
  selectedId?: number;
  isPremium?: boolean;
}) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<Station | null>(null);
  const [viewToast, setViewToast] = useState<{ points: number; alreadyViewed: boolean } | null>(null);

  const filtered = stations.filter((s) => {
    if (filter === "active") return s.isActive;
    if (filter === "inactive") return !s.isActive;
    if (filter === "kleoxm") return s.companyName === "KLEOXM 111";
    if (filter === "other") return s.companyName && s.companyName !== "KLEOXM 111";
    return true;
  });

  const validStations = filtered.filter(
    (s) => s.latitude && s.longitude && s.latitude !== 0 && s.longitude !== 0
  );

  const activeCount = stations.filter(s => s.isActive).length;
  const inactiveCount = stations.filter(s => !s.isActive).length;
  const kleoxmCount = stations.filter(s => s.companyName === "KLEOXM 111").length;
  const otherCount = stations.filter(s => s.companyName && s.companyName !== "KLEOXM 111").length;

  const trackView = async (stationId: number) => {
    try {
      const res = await apiFetch("/api/stations/view", {
        method: "POST",
        body: JSON.stringify({ stationId }),
      });
      const data = await res.json();
      if (data.pointsEarned > 0) {
        setViewToast({ points: data.pointsEarned, alreadyViewed: false });
      } else if (data.alreadyViewed) {
        setViewToast({ points: 0, alreadyViewed: true });
      }
      setTimeout(() => setViewToast(null), 3000);
    } catch {}
  };

  const handleSelect = (s: Station) => {
    setSelected(s);
    onSelect?.(s);
    trackView(s.id);
  };

  const getCompanyColor = (companyName: string) => {
    if (companyName === "KLEOXM 111") return "text-amber-400";
    if (companyName) return "text-blue-400";
    return "text-green-300";
  };

  const getCompanyBadge = (companyName: string) => {
    if (companyName === "KLEOXM 111") return { bg: "bg-amber-500/10", text: "text-amber-400", label: "KLEOXM 111" };
    if (companyName) return { bg: "bg-blue-500/10", text: "text-blue-400", label: companyName };
    return { bg: "bg-slate-500/10", text: "text-green-300", label: "No Company" };
  };

  return (
    <div className="space-y-4">
      {/* View Toast Notification */}
      {viewToast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
          viewToast.alreadyViewed
            ? "bg-green-900 border border-green-700"
            : "bg-green-500/20 border border-green-400/30"
        }`}>
          <span className="text-lg">{viewToast.alreadyViewed ? "👁️" : "⭐"}</span>
          <span className="text-sm font-medium text-white">
            {viewToast.alreadyViewed
              ? "Already viewed today"
              : `+${viewToast.points} point earned!`}
          </span>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
            filter === "all" ? "bg-amber-400 text-[#0f172a]" : "bg-green-950 text-green-300 hover:bg-green-900"
          }`}>
          All ({stations.length})
        </button>
        <button onClick={() => setFilter("active")}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
            filter === "active" ? "bg-green-400 text-[#0f172a]" : "bg-green-950 text-green-300 hover:bg-green-900"
          }`}>
          Active ({activeCount})
        </button>
        <button onClick={() => setFilter("inactive")}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
            filter === "inactive" ? "bg-red-400 text-[#0f172a]" : "bg-green-950 text-green-300 hover:bg-green-900"
          }`}>
          Inactive ({inactiveCount})
        </button>
        <button onClick={() => setFilter("kleoxm")}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
            filter === "kleoxm" ? "bg-amber-400 text-[#0f172a]" : "bg-green-950 text-green-300 hover:bg-green-900"
          }`}>
          KLEOXM 111 ({kleoxmCount})
        </button>
        <button onClick={() => setFilter("other")}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
            filter === "other" ? "bg-blue-400 text-[#0f172a]" : "bg-green-950 text-green-300 hover:bg-green-900"
          }`}>
          Other Company ({otherCount})
        </button>
      </div>

      {/* Non-premium notice */}
      {!isPremium && (
        <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
          <p className="text-xs text-amber-400">📍 Nearby stations are hidden. <span className="font-bold">Subscribe to see all stations near you!</span></p>
        </div>
      )}

      {/* Station List + Map Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Station Cards */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((s) => {
            const companyBadge = getCompanyBadge(s.companyName);
            
            return (
              <div
                key={s.id}
                onClick={() => handleSelect(s)}
                className={`cursor-pointer glass-card rounded-xl p-4 transition-all ${
                  selected?.id === s.id ? "border-2 border-amber-400 glow-solar" : 
                  "border border-green-800/50 hover:border-amber-400/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-white text-sm">{s.name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                    {s.isActive ? "Active" : "Offline"}
                  </span>
                </div>

                {/* Company Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded ${companyBadge.bg} ${companyBadge.text}`}>
                    {companyBadge.label}
                  </span>
                  {s.distanceKm !== undefined && (
                    <span className="text-[10px] px-2 py-0.5 bg-green-900 text-green-200 rounded">
                      {s.distanceKm.toFixed(1)} km away
                    </span>
                  )}
                </div>

                {s.ownerName && (
                  <p className="text-[11px] text-green-300 mb-1">
                    <span className="text-green-400">Owner:</span> {s.ownerName}
                  </p>
                )}

                <p className="text-xs text-green-400 mt-1">{s.address}</p>

                {(s.cableTypeC > 0 || s.cableIPhone > 0 || s.cableUniversal > 0) && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {s.cableTypeC > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">Type-C: {s.cableTypeC}</span>}
                    {s.cableIPhone > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">iPhone: {s.cableIPhone}</span>}
                    {s.cableUniversal > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-slate-500/10 text-green-300 rounded">USB: {s.cableUniversal}</span>}
                  </div>
                )}
              </div>
            );
          })}

          {validStations.length === 0 && (
            <div className="text-center py-12 text-green-300">
              <p className="text-4xl mb-2">📍</p>
              <p>No stations found</p>
            </div>
          )}
        </div>

        {/* Right: Google Map */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {selected ? (
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-green-800/50 bg-[#14291a]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{selected.name}</h4>
                    <p className={`text-[10px] ${getCompanyColor(selected.companyName)}`}>{selected.companyName}</p>
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
            <div className="h-[400px] flex items-center justify-center bg-[#0a1f0f]">
              <div className="text-center text-green-300">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <p className="text-sm">Select a station to view on map</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Station Details Panel */}
      {selected && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{selected.name}</h3>
              <p className={`text-sm font-medium ${getCompanyColor(selected.companyName)}`}>
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
                  <p className="text-[10px] text-green-400 uppercase tracking-wider">Owner</p>
                  <p className="text-sm text-white">{selected.ownerName}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-green-400 uppercase tracking-wider">Location</p>
                <p className="text-sm text-white">{selected.address}</p>
                {selected.location && <p className="text-xs text-green-400 mt-0.5">📍 {selected.location}</p>}
              </div>
              <div>
                <p className="text-[10px] text-green-400 uppercase tracking-wider">Coordinates</p>
                <p className="text-sm text-green-200">{selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}</p>
              </div>
              {selected.distanceKm !== undefined && (
                <div>
                  <p className="text-[10px] text-green-400 uppercase tracking-wider">Distance</p>
                  <p className="text-sm text-amber-400">{selected.distanceKm.toFixed(1)} km away</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-green-400 uppercase tracking-wider">Available Cables</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {selected.cableTypeC > 0 && <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg">Type-C: {selected.cableTypeC}</span>}
                  {selected.cableIPhone > 0 && <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg">iPhone: {selected.cableIPhone}</span>}
                  {selected.cableUniversal > 0 && <span className="text-xs px-2 py-1 bg-slate-500/10 text-green-300 rounded-lg">USB: {selected.cableUniversal}</span>}
                  {selected.outlets > 0 && <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg">Outlets: {selected.outlets}</span>}
                </div>
              </div>
              <div className="bg-green-950/50 rounded-lg p-3 text-center mt-2">
                <div className="text-lg font-bold text-blue-400">{selected.totalVisits || selected.views || 0}</div>
                <div className="text-[10px] text-green-400">Total Views</div>
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
