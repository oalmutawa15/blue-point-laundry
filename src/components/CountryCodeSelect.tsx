"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

// A custom (non-native) country dial-code picker. Native <select> is unreliable
// here (opens-then-closes inside a label, invisible in tests, awkward on mobile),
// so this renders a real DOM list we fully control.
export function CountryCodeSelect({
  dial,
  onChange,
  lang,
}: {
  dial: string;
  onChange: (dial: string) => void;
  lang: "ar" | "en";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = COUNTRIES.find((c) => c.dial === dial);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Country code"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-full items-center gap-1 rounded-l-xl border-r border-border bg-muted px-3 py-3 text-sm font-semibold text-muted-foreground"
      >
        <span className="text-base leading-none">{current?.flag ?? "🏳️"}</span>
        <span className="tabular-nums">+{dial}</span>
        <span aria-hidden className="text-xs opacity-60">▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          dir={lang === "ar" ? "rtl" : "ltr"}
          className="absolute top-full z-50 mt-1 max-h-64 w-64 overflow-auto rounded-xl border border-border bg-white py-1 shadow-xl ltr:left-0 rtl:right-0"
        >
          {COUNTRIES.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => {
                  onChange(c.dial);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${
                  c.dial === dial ? "bg-brand/5 font-semibold text-brand" : "text-foreground"
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1 text-start">{lang === "ar" ? c.nameAr : c.name}</span>
                <span dir="ltr" className="tabular-nums text-muted-foreground">+{c.dial}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
