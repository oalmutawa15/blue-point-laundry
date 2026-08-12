"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatAddress } from "@/lib/address";
import { WeekdayPicker } from "@/components/WeekdayPicker";
import { saveMyPickupSchedule, type PickupSchedule } from "@/app/actions/schedules";
import type { Tables } from "@/types/database";

const PRESETS: { key: string; days: number[] }[] = [
  { key: "weekend", days: [5, 6] }, // Fri, Sat
  { key: "five", days: [0, 1, 2, 3, 4] }, // Sun–Thu
  { key: "all", days: [0, 1, 2, 3, 4, 5, 6] },
];

export function PickupScheduleView({
  schedule,
  addresses,
}: {
  schedule: PickupSchedule | null;
  addresses: Tables<"addresses">[];
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const hasAddress = addresses.length > 0;
  const defaultAddr =
    schedule?.address_id ?? addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? "";

  const [days, setDays] = useState<number[]>(schedule?.active ? schedule.weekdays : []);
  const [addressId, setAddressId] = useState(defaultAddr);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setSaved(false);
    setError(null);
    const res = await saveMyPickupSchedule(days, addressId || null);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const presetLabel = (key: string) =>
    key === "weekend" ? (lang === "ar" ? "نهاية الأسبوع" : "Weekend") :
    key === "five" ? (lang === "ar" ? "٥ أيام" : "5 days") :
    (lang === "ar" ? "كل الأيام" : "Every day");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t.schedule.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.schedule.subtitle}</p>
      </div>

      {!hasAddress ? (
        <div className="rounded-2xl bg-card p-5 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">{t.schedule.needAddress}</p>
          <Link
            href="/addresses"
            className="mt-3 inline-block rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground"
          >
            {t.nav.addresses}
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 rounded-2xl bg-card p-5 shadow-sm">
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const on = p.days.length === days.length && p.days.every((d) => days.includes(d));
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setDays(p.days)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
                      on ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {presetLabel(p.key)}
                  </button>
                );
              })}
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t.schedule.chooseDays}</p>
              <WeekdayPicker value={days} onChange={setDays} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                {t.schedule.pickupFrom}
              </label>
              <select
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label ? `${a.label} — ` : ""}
                    {formatAddress(a, lang)}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-muted-foreground">{t.schedule.note}</p>

            {days.length === 0 ? (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
                {t.schedule.offHint}
              </p>
            ) : (
              <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs font-semibold text-brand">
                {t.schedule.activeOn}{" "}
                {days.map((d) => t.weekdays[d]).join(lang === "ar" ? "، " : ", ")}
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>
            )}
            {saved && (
              <p className="rounded-lg bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                {t.schedule.saved}
              </p>
            )}

            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground disabled:opacity-50"
            >
              {busy ? t.common.saving : t.schedule.save}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
