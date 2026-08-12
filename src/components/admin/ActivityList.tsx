"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";

export type ActivityRow = {
  id: string;
  action: string;
  target: string | null;
  created_at: string;
  actor: { full_name: string | null; phone: string } | null;
};

export function ActivityList({ rows }: { rows: ActivityRow[] }) {
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar-KW" : "en-GB";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t.admin.activity.title}</h1>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
          {t.admin.activity.none}
        </p>
      ) : (
        <div className="divide-y divide-border rounded-2xl bg-card px-4 shadow-sm">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">
                  <span className="font-mono text-brand">{r.action}</span>
                  {r.target ? <span className="text-muted-foreground"> · {r.target}</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.actor?.full_name || r.actor?.phone || "—"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString(locale, {
                  day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
