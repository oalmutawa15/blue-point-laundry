"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";

export function OffersView() {
  const { t } = useLang();
  const [note, setNote] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t.offers.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.offers.scanPrompt}</p>
      </div>

      <button
        type="button"
        onClick={() => setNote(true)}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand px-4 py-4 text-base font-bold text-brand-foreground"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 21v.01M17 21h.01M21 17h.01" /></svg>
        {t.offers.scan}
      </button>

      {note && (
        <p className="rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground shadow-sm">
          {t.offers.comingSoon}
        </p>
      )}
    </div>
  );
}
