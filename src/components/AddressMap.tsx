"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "bp-pin",
  html: `<svg width="30" height="42" viewBox="0 0 24 24" fill="#154384" stroke="white" stroke-width="1.2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.6" fill="white"/></svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

// Read-only map that just shows a pin — for shop staff and drivers.
export default function AddressMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { attributionControl: false }).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 120);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return <div ref={ref} className="h-56 w-full rounded-xl border border-border" />;
}
