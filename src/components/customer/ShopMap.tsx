"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Read-only map centered on the Blue Point shop. Loaded via next/dynamic with
// ssr:false so Leaflet (which needs `window`) never runs on the server.
export default function ShopMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    map.setView([lat, lng], 16);
    const icon = L.divIcon({
      className: "",
      html: `<svg width="34" height="46" viewBox="0 0 24 24" fill="#154384" stroke="white" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.6" fill="white"/></svg>`,
      iconSize: [34, 46],
      iconAnchor: [17, 46],
    });
    L.marker([lat, lng], { icon }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className="h-72 w-full rounded-2xl border border-border" />;
}
