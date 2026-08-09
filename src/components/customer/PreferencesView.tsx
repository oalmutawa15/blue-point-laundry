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

  function pick(group: string, option: string) {
    setSaved(false);
    setPrefs((p) => ({ ...p, [group]: p[group as keyof Preferences] === option ? undefined : option }));
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

      {PREF_GROUPS.map((g) => (
        <div key={g.key} className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="mb-3 font-bold text-brand">{name(g)}</p>
          <div className="flex flex-wrap gap-2">
            {g.options.map((o) => {
              const active = prefs[g.key] === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => pick(g.key, o.key)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-white text-foreground hover:border-brand"
                  }`}
                >
                  {name(o)}
                </button>
              );
            })}
          </div>
        </div>
      ))}

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
