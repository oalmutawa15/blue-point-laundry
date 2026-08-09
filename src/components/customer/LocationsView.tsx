"use client";

import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n/LanguageProvider";

// Leaflet needs `window`, so load the map only on the client.
const ShopMap = dynamic(() => import("./ShopMap"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-2xl bg-muted" />,
});

// Real Blue Point Laundry shop location.
const SHOP = { lat: 29.3348158, lng: 48.072984 };
const MAPS_URL =
  "https://www.google.com/maps/place/Blue+point+laundry/@29.3348158,48.0704091,17z/data=!3m1!4b1!4m6!3m5!1s0x3fcf9da1a1802dd1:0x6f9222f341624028!8m2!3d29.3348158!4d48.072984";

export function LocationsView() {
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">{t.locations.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.locations.subtitle}</p>
      </div>

      <ShopMap lat={SHOP.lat} lng={SHOP.lng} />

      <a
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-brand-foreground"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
        {t.locations.openInMaps}
      </a>
    </div>
  );
}
