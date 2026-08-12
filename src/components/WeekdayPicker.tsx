"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";

// Seven day chips (0 = Sunday .. 6 = Saturday). Controlled by `value`/`onChange`.
export function WeekdayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (days: number[]) => void;
}) {
  const { t } = useLang();
  const toggle = (d: number) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort((a, b) => a - b));

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {t.weekdaysShort.map((label, d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            onClick={() => toggle(d)}
            className={`rounded-xl border py-2 text-center text-xs font-bold transition-colors ${
              on ? "border-brand bg-brand text-brand-foreground" : "border-border text-muted-foreground"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
