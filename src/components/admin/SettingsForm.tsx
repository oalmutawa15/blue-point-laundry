"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { updateCostPct } from "@/app/actions/admin";

export function SettingsForm({ costPct }: { costPct: number }) {
  const { t } = useLang();
  const router = useRouter();
  const [value, setValue] = useState(String(costPct));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    const res = await updateCostPct(parseFloat(value));
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{t.admin.settings.title}</h1>
      <div className="max-w-md rounded-2xl bg-card p-5 shadow-sm">
        <label className="mb-1 block text-sm font-semibold">{t.admin.settings.costPct}</label>
        <p className="mb-2 text-xs text-muted-foreground">{t.admin.settings.costPctHelp}</p>
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/[^\d.]/g, ""));
              setSaved(false);
            }}
            inputMode="decimal"
            className="w-28 rounded-lg border border-border bg-white px-3 py-2.5 text-sm tabular-nums outline-none focus:border-brand"
          />
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
          >
            {busy ? t.common.saving : t.admin.settings.save}
          </button>
          {saved && <span className="self-center text-sm font-semibold text-success">{t.admin.settings.saved}</span>}
        </div>
      </div>
    </div>
  );
}
