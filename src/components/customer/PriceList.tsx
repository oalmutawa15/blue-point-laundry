"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { PRICE_CATEGORIES } from "@/lib/priceList";

function money(fils: number | null | undefined) {
  if (fils === null || fils === undefined) return "—";
  return (fils / 1000).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function PriceList() {
  const { t, lang } = useLang();
  const [active, setActive] = useState(PRICE_CATEGORIES[0].key);
  const cat = PRICE_CATEGORIES.find((c) => c.key === active) ?? PRICE_CATEGORIES[0];
  const name = (o: { en: string; ar: string }) => (lang === "ar" ? o.ar : o.en);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">{t.prices.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.prices.subtitle}</p>
      </div>

      {/* Category tabs */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {PRICE_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActive(c.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              c.key === active
                ? "bg-brand text-brand-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {name(c)}
          </button>
        ))}
      </div>

      {cat.kind === "garment" ? (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
          {/* Header row */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-1 border-b border-border bg-brand/5 px-3 py-2.5 text-center text-[11px] font-bold text-brand">
            <div className="text-start">{t.prices.item}</div>
            <div>{t.prices.wash}</div>
            <div>{t.prices.dryclean}</div>
            <div>{t.prices.iron}</div>
          </div>
          <div className="divide-y divide-border">
            {cat.items.map((it) => (
              <div
                key={it.key}
                className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center gap-1 px-3 py-3 text-center text-sm"
              >
                <div className="text-start font-semibold">{name(it)}</div>
                <div className="tabular-nums">{money(it.prices?.wash)}</div>
                <div className="tabular-nums">{money(it.prices?.dryclean)}</div>
                <div className="tabular-nums">{money(it.prices?.iron)}</div>
              </div>
            ))}
          </div>
          <p className="px-3 py-2.5 text-center text-xs text-muted-foreground">
            {t.prices.currencyNote}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-brand/5 px-3 py-2.5 text-[11px] font-bold text-brand">
            <span>{t.prices.item}</span>
            <span>{t.prices.startingFrom}</span>
          </div>
          <div className="divide-y divide-border">
            {cat.items.map((it) => (
              <div key={it.key} className="flex items-center justify-between px-3 py-3 text-sm">
                <span className="font-semibold">{name(it)}</span>
                <span className="tabular-nums font-bold text-brand">
                  {money(it.from)} <span className="text-xs font-normal text-muted-foreground">{t.prices.kd}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="px-3 py-2.5 text-center text-xs text-muted-foreground">
            {t.prices.currencyNote}
          </p>
        </div>
      )}
    </div>
  );
}
