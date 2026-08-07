"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KUWAIT_CENTER } from "@/lib/kuwait";

const pinIcon = L.divIcon({
  className: "bp-pin",
  html: `<svg width="30" height="42" viewBox="0 0 24 24" fill="#154384" stroke="white" stroke-width="1.2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.6" fill="white"/></svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

export default function LocationMap({
  initial,
  flyTo,
  onPick,
}: {
  initial: { lat: number; lng: number } | null;
  flyTo: { lat: number; lng: number; key: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const start = initial ?? { lat: KUWAIT_CENTER[0], lng: KUWAIT_CENTER[1] };
    const map = L.map(ref.current, { attributionControl: false }).setView(
      [start.lat, start.lng],
      initial ? 15 : 10,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
    const marker = L.marker([start.lat, start.lng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      onPickRef.current(p.lat, p.lng);
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onPickRef.current(e.latlng.lat, e.latlng.lng);
    });
    mapRef.current = map;
    markerRef.current = marker;
    setTimeout(() => map.invalidateSize(), 120);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter + move pin when an area is chosen from the dropdown.
  useEffect(() => {
    if (!flyTo || !mapRef.current || !markerRef.current) return;
    mapRef.current.setView([flyTo.lat, flyTo.lng], 15);
    markerRef.current.setLatLng([flyTo.lat, flyTo.lng]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.key]);

  return <div ref={ref} className="h-64 w-full rounded-xl border border-border" />;
}
