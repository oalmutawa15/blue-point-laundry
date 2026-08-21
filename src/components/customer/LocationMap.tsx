"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KUWAIT_CENTER } from "@/lib/kuwait";

// Center-fixed pin: the pin stays in the middle and the user drags the MAP under it.
// On every move, the map center becomes the chosen location — UNLESS `locked`, in
// which case every interaction is disabled so scrolling/panning can never change
// the confirmed location.
export default function LocationMap({
  initial,
  flyTo,
  onPick,
  locked = false,
}: {
  initial: { lat: number; lng: number } | null;
  flyTo: { lat: number; lng: number; key: number } | null;
  onPick: (lat: number, lng: number) => void;
  locked?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const suppress = useRef(false); // ignore moves we trigger programmatically
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const start = initial ?? { lat: KUWAIT_CENTER[0], lng: KUWAIT_CENTER[1] };
    // scrollWheelZoom off: scrolling the PAGE over the map must never zoom/move it.
    const map = L.map(ref.current, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
    map.on("moveend", () => {
      if (lockedRef.current) return; // confirmed → never update
      if (suppress.current) {
        suppress.current = false;
        return;
      }
      const c = map.getCenter();
      onPickRef.current(c.lat, c.lng);
    });
    suppress.current = true; // consume the initial setView's moveend
    map.setView([start.lat, start.lng], initial ? 17 : 11);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock / unlock all interactions when `locked` flips.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const parts = [map.dragging, map.touchZoom, map.doubleClickZoom, map.boxZoom, map.keyboard];
    if (locked) {
      parts.forEach((p) => p && p.disable());
      // @ts-expect-error tap exists only on touch builds
      if (map.tap) map.tap.disable();
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      // @ts-expect-error tap exists only on touch builds
      if (map.tap) map.tap.enable();
    }
  }, [locked]);

  // Recenter when an area is chosen from the dropdown (never while locked).
  useEffect(() => {
    if (!flyTo || !mapRef.current || locked) return;
    suppress.current = true;
    mapRef.current.setView([flyTo.lat, flyTo.lng], 17);
    const t = setTimeout(() => {
      suppress.current = false;
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.key]);

  return (
    <div className="relative">
      <div
        ref={ref}
        className={`h-64 w-full rounded-xl border ${locked ? "border-success" : "border-border"}`}
      />
      {/* Fixed center pin (tip points at the exact center) */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full drop-shadow">
        <svg width="34" height="46" viewBox="0 0 24 24" fill="#e11d48" stroke="white" strokeWidth="1.5">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.6" fill="white" />
        </svg>
      </div>
      {/* Locked badge — makes it obvious the location is fixed */}
      {locked && (
        <div className="pointer-events-none absolute right-2 top-2 z-[500] flex h-7 w-7 items-center justify-center rounded-full bg-success text-white shadow">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        </div>
      )}
    </div>
  );
}
