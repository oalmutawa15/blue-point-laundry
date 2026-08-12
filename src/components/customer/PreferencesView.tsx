"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { PREF_GROUPS, type Preferences } from "@/lib/preferences";
import { savePreferences } from "@/app/actions/preferences";

export function PreferencesView({ initial }: { initial: Preferences }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Preferences>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const name = (o: { en: string; ar: string }) => (lang === "ar" ? o.ar : o.en);

  function setGroup(group: string, value: string) {
    setSaved(false);
    setPrefs((p) => ({ ...p, [group]: value || undefined }));
  }

  async function save() {
    setBusy(true);
    await savePreferences(prefs);
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t.preferences.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.preferences.subtitle}</p>
      </div>

      <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
        {PREF_GROUPS.map((g) => (
          <label key={g.key} className="block">
            <span className="mb-1 block text-sm font-bold text-brand">{name(g)}</span>
            <select
              value={(prefs[g.key] as string) ?? ""}
              onChange={(e) => setGroup(g.key, e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand"
            >
              <option value="">{t.preferences.choose}</option>
              {g.options.map((o) => (
                <option key={o.key} value={o.key}>
                  {name(o)}
                </option>
              ))}
            </select>
          </label>
        ))}

        {/* Free-text notes */}
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-brand">{t.preferences.notes}</span>
          <textarea
            value={prefs.notes ?? ""}
            onChange={(e) => {
              setSaved(false);
              setPrefs((p) => ({ ...p, notes: e.target.value }));
            }}
            rows={3}
            placeholder={t.preferences.notesPlaceholder}
            className="w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground disabled:opacity-50"
        >
          {busy ? t.common.saving : t.preferences.save}
        </button>
        <button
          onClick={() => {
            setPrefs({});
            setSaved(false);
          }}
          className="rounded-xl border border-border px-4 py-3.5 text-base font-bold text-brand"
        >
          {t.preferences.clear}
        </button>
      </div>
      {saved && <p className="text-center text-sm font-semibold text-success">{t.preferences.saved}</p>}
    </div>
  );
}
