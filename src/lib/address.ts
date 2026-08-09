import type { Tables } from "@/types/database";
import type { Lang } from "@/lib/i18n/dictionaries";
import { findAreaByEn, toArabicDigits } from "@/lib/kuwait";

// Compact one-line Kuwait address (area localized, Arabic-Indic digits in Arabic).
export function formatAddress(a: Tables<"addresses">, lang: Lang): string {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const d = (s: string) => (lang === "ar" ? toArabicDigits(s) : s);
  const parts: string[] = [];
  if (a.area) {
    const found = findAreaByEn(a.area);
    parts.push(found ? (lang === "ar" ? found.ar : found.en) : a.area);
  }
  if (a.block) parts.push(`${L("قطعة", "Block")} ${d(a.block)}`);
  if (a.street) parts.push(`${L("شارع", "Street")} ${d(a.street)}`);
  if (a.building) parts.push(`${L("منزل", "House")} ${d(a.building)}`);
  if (a.floor) parts.push(`${L("دور", "Floor")} ${a.floor === "0" ? L("أرضي", "G") : d(a.floor)}`);
  if (a.apartment) parts.push(`${L("شقة", "Apt")} ${d(a.apartment)}`);
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
