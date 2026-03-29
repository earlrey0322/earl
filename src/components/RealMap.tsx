"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

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

// Dynamically import map components (no SSR)
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

function MapInner({ stations, onSelect, selectedId }: { stations: Station[]; onSelect?: (s: Station) => void; selectedId?: number }) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      // Fix default marker icon
      delete (leaflet.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setL(leaflet);
    });
  }, []);

  if (!L) return <div className="w-full h-full flex items-center justify-center text-slate-400">Loading map...</div>;

  const createIcon = (color: string) => {
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.4);border:2px solid white;cursor:pointer;">⚡</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  const activeIcon = createIcon("#f59e0b");
  const otherIcon = createIcon("#22c55e");
  const inactiveIcon = createIcon("#ef4444");

  return (
    <MapContainer center={[14.5995, 120.9842]} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((station) => {
        const icon = !station.isActive ? inactiveIcon : station.companyName === "KLEOXM 111" ? activeIcon : otherIcon;
        return (
          <Marker key={station.id} position={[station.latitude, station.longitude]} icon={icon} eventHandlers={{ click: () => onSelect?.(station) }}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>{station.name}</strong><br />
                <span style={{ color: "#f59e0b" }}>{station.companyName}</span><br />
                <span style={{ color: "#666", fontSize: 12 }}>{station.address}</span><br />
                <span style={{ color: station.isActive ? "#22c55e" : "#ef4444", fontSize: 12 }}>
                  {station.isActive ? "● Active" : "● Inactive"}
                </span><br />
                <span style={{ color: "#888", fontSize: 11 }}>
                  {station.totalVisits} visits | {station.batteryLevel}% battery
                </span><br />
                <span style={{ color: "#888", fontSize: 11 }}>
                  {station.cableTypeC > 0 && `Type-C:${station.cableTypeC} `}
                  {station.cableIPhone > 0 && `iPhone:${station.cableIPhone} `}
                  {station.cableUniversal > 0 && `USB:${station.cableUniversal} `}
                  {station.outlets > 0 && `Outlets:${station.outlets}`}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
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
  const [mounted, setMounted] = useState(false);

  if (typeof window !== "undefined" && !mounted) {
    setMounted(true);
  }

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
            Use My Location
          </button>
        )}
        {!showAllBrands && <span className="px-4 py-1.5 text-xs text-amber-400 bg-amber-400/10 rounded-full">Premium = All Companies</span>}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden" style={{ height: "450px" }}>
        {mounted ? (
          <MapInner stations={filteredStations} onSelect={onSelect} selectedId={selectedId} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a2332] text-slate-400">Loading map...</div>
        )}
      </div>

      <div className="flex gap-4 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400" />KLEOXM 111</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-400" />Other</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" />Inactive</div>
      </div>

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
