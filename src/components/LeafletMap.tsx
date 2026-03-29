"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function createIcon(color: string, borderColor: string) {
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    html: `<div style="width:28px;height:28px;background:${color};border:3px solid ${borderColor};border-radius:50% 50% 50% 4px;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  });
}

export default function LeafletMap({
  stations,
  onSelect,
}: {
  stations: Station[];
  onSelect?: (s: Station) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const validStations = stations.filter(
    (s) => s.latitude && s.longitude && s.latitude !== 0 && s.longitude !== 0
  );

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const center: [number, number] = validStations.length > 0
        ? [validStations[0].latitude, validStations[0].longitude]
        : [14.5995, 120.9842];

      mapInstanceRef.current = L.map(mapRef.current, {
        center,
        zoom: 12,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    validStations.forEach((s) => {
      const color = getMarkerColor(s);
      const borderColor = getMarkerBorderColor(s);
      const icon = createIcon(color, borderColor);

      const marker = L.marker([s.latitude, s.longitude], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:200px;font-family:system-ui">
            <strong style="font-size:14px">${s.name}</strong><br/>
            <span style="color:${s.companyName === "KLEOXM 111" ? "#3b82f6" : "#eab308"};font-size:12px">${s.companyName}</span><br/>
            <span style="color:${s.isActive ? "#22c55e" : "#ef4444"};font-size:12px;font-weight:600">
              ${s.isActive ? "● Active" : "● Inactive"}
            </span>
            <div style="font-size:11px;color:#888;margin-top:4px">${s.address}</div>
            <div style="font-size:10px;color:#aaa;margin-top:2px">
              ${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}
            </div>
            <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
              <span style="font-size:10px;padding:2px 8px;background:#22c55e20;color:#22c55e;border-radius:12px">
                Visits: ${s.totalVisits}
              </span>
              <span style="font-size:10px;padding:2px 8px;background:#eab30820;color:#eab308;border-radius:12px">
                Battery: ${s.batteryLevel || 0}%
              </span>
            </div>
            <button
              onclick="window.open('https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}','_blank')"
              style="margin-top:8px;width:100%;padding:8px 0;font-size:12px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600"
            >
              Open in Google Maps
            </button>
          </div>`
        );

      marker.on("click", () => onSelect?.(s));
      markersRef.current.push(marker);
    });

    if (validStations.length > 0) {
      const bounds = L.latLngBounds(validStations.map((s) => [s.latitude, s.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [validStations, onSelect]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="h-[400px] w-full" />;
}
