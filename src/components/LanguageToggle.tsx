"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, toggle } = useLang();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch language"
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 ${className}`}
    >
      {/* Show the language you can switch TO */}
      {lang === "ar" ? "English" : "العربية"}
    </button>
  );
}
