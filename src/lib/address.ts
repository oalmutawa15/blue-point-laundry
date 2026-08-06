import type { Tables } from "@/types/database";
import type { Lang } from "@/lib/i18n/dictionaries";

// Compact one-line Kuwait address.
export function formatAddress(a: Tables<"addresses">, lang: Lang): string {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const parts: string[] = [];
  if (a.area) parts.push(a.area);
  if (a.block) parts.push(`${L("قطعة", "Block")} ${a.block}`);
  if (a.street) parts.push(`${L("شارع", "St")} ${a.street}`);
  if (a.building) parts.push(`${L("مبنى", "Bldg")} ${a.building}`);
  if (a.apartment) parts.push(`${L("شقة", "Apt")} ${a.apartment}`);
  return parts.join(lang === "ar" ? "، " : ", ");
}

// Google Maps link for navigation (coords if available, else text query).
export function mapsUrl(a: Tables<"addresses">): string {
  if (a.lat != null && a.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`;
  }
  const q = [
    a.area,
    a.block && `Block ${a.block}`,
    a.street && `Street ${a.street}`,
    a.building,
  ]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q + ", Kuwait")}`;
}
