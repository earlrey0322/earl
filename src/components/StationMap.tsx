"use client";

import { useEffect, useState } from "react";

interface Station {
  id: number; name: string; companyName: string; brand: string;
  ownerId: number | null; ownerName: string | null;
  latitude: number; longitude: number; address: string;
  contactNumber: string | null; isActive: boolean;
  solarWatts: number; batteryLevel: number; totalVisits: number; revenue?: number;
  cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
}

function getMarkerColor(s: Station): string {
  if (s.companyName === "KLEOXM 111") return "#3b82f6";
  return "#eab308";
}

function getMarkerBorderColor(s: Station): string {
  if (s.isActive) return "#22c55e";
  return "#ef4444";
}

function createLeafletIcon(L: any, color: string, borderColor: string) {
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    html: `<div style="width:28px;height:28px;background:${color};border:3px solid ${borderColor};border-radius:50% 50% 50% 4px;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  });
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
  const [mapComps, setMapComps] = useState<any>(null);
  const [leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([rl, L]) => {
      setMapComps(rl);
      setLeaflet(L.default);
    });
  }, []);

  const filtered = stations.filter((s) => {
    if (filter === "active") return s.isActive;
    if (filter === "kleoxm") return s.companyName === "KLEOXM 111";
    return true;
  });

  const validStations = filtered.filter(
    (s) => s.latitude && s.longitude && s.latitude !== 0 && s.longitude !== 0
  );

  const allValid = stations.filter(
    (s) => s.latitude && s.longitude && s.latitude !== 0 && s.longitude !== 0
  );

  const center: [number, number] = allValid.length > 0
    ? [allValid[0].latitude, allValid[0].longitude]
    : [14.5995, 120.9842];

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
        {!mapComps || !leaflet ? (
          <div className="h-[400px] flex items-center justify-center bg-[#0f172a]">
            <div className="text-slate-400 text-sm">Loading map...</div>
          </div>
        ) : (
          <div className="h-[400px]">
            <mapComps.MapContainer
              center={center}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <mapComps.TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {validStations.map((s) => {
                const color = getMarkerColor(s);
                const borderColor = getMarkerBorderColor(s);
                const icon = createLeafletIcon(leaflet, color, borderColor);
                return (
                  <mapComps.Marker
                    key={s.id}
                    position={[s.latitude, s.longitude]}
                    icon={icon}
                    eventHandlers={{ click: () => onSelect?.(s) }}
                  >
                    <mapComps.Popup>
                      <div style={{ minWidth: 200, fontFamily: "system-ui" }}>
                        <strong style={{ fontSize: 14 }}>{s.name}</strong>
                        <br />
                        <span style={{ color: s.companyName === "KLEOXM 111" ? "#3b82f6" : "#eab308", fontSize: 12 }}>
                          {s.companyName}
                        </span>
                        <br />
                        <span style={{ color: s.isActive ? "#22c55e" : "#ef4444", fontSize: 12, fontWeight: 600 }}>
                          {s.isActive ? "● Active" : "● Inactive"}
                        </span>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{s.address}</div>
                        <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
                          {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                        </div>
                        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, padding: "2px 8px", background: "#22c55e20", color: "#22c55e", borderRadius: 12 }}>
                            Visits: {s.totalVisits}
                          </span>
                          <span style={{ fontSize: 10, padding: "2px 8px", background: "#eab30820", color: "#eab308", borderRadius: 12 }}>
                            Battery: {s.batteryLevel || 0}%
                          </span>
                        </div>
                        <button
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`, "_blank")}
                          style={{
                            marginTop: 8, width: "100%", padding: "8px 0", fontSize: 12,
                            background: "#3b82f6", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600,
                          }}
                        >
                          Open in Google Maps
                        </button>
                      </div>
                    </mapComps.Popup>
                  </mapComps.Marker>
                );
              })}
            </mapComps.MapContainer>
          </div>
        )}

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
