"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { WeekdayPicker } from "@/components/WeekdayPicker";
import { searchCustomers, type CustomerHit } from "@/app/actions/walkin";
import {
  createDeliverySchedule,
  setDeliveryScheduleActive,
  deleteDeliverySchedule,
  type DeliveryScheduleRow,
  type DriverOption,
} from "@/app/actions/schedules";

export function ShopDeliverySchedules({
  schedules,
  drivers,
}: {
  schedules: DeliveryScheduleRow[];
  drivers: DriverOption[];
}) {
  const { t, lang } = useLang();
  const router = useRouter();

  // New-schedule form state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<CustomerHit | null>(null);
  const [driverId, setDriverId] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (customer) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      const rows = await searchCustomers(q);
      if (mine === seq.current) {
        setResults(rows);
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, customer]);

  async function create() {
    setError(null);
    if (!customer) return setError(t.shopSchedule.needCustomer);
    if (!driverId) return setError(t.shopSchedule.needDriver);
    if (days.length === 0) return setError(t.shopSchedule.needDays);
    setBusy(true);
    const res = await createDeliverySchedule({ customerId: customer.id, weekdays: days, driverId });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    // reset
    setCustomer(null);
    setQuery("");
    setDriverId("");
    setDays([]);
    router.refresh();
  }

  async function toggle(id: string, active: boolean) {
    await setDeliveryScheduleActive(id, active);
    router.refresh();
  }
  async function remove(id: string) {
    if (!window.confirm(t.shopSchedule.remove + "?")) return;
    await deleteDeliverySchedule(id);
    router.refresh();
  }

  const dayNames = (ds: number[]) => ds.map((d) => t.weekdaysShort[d]).join(lang === "ar" ? "، " : ", ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t.shopSchedule.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.shopSchedule.subtitle}</p>
      </div>

      {/* New schedule */}
      <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-brand">{t.shopSchedule.add}</h2>

        {/* Customer */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t.shopSchedule.customer}</p>
          {customer ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="font-semibold">
                {customer.full_name || "—"}{" "}
                <span className="text-xs font-normal text-muted-foreground" dir="ltr">{customer.phone}</span>
              </span>
              <button type="button" onClick={() => setCustomer(null)} className="text-xs font-semibold text-brand">
                {t.pos.change}
              </button>
            </div>
          ) : (
            <>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.shopSchedule.pickCustomer}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              />
              {query.trim().length >= 2 && (
                <div className="mt-1 overflow-hidden rounded-lg border border-border">
                  {searching && results.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">{t.common.loading}</p>
                  ) : results.length > 0 ? (
                    results.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCustomer(c);
                          setResults([]);
                        }}
                        className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-start text-sm last:border-b-0 hover:bg-muted"
                      >
                        <span className="font-semibold">{c.full_name || "—"}</span>
                        <span className="text-xs text-muted-foreground" dir="ltr">{c.phone}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted-foreground">{t.pos.noResults}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Driver */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t.shopSchedule.driver}</p>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">{t.shopSchedule.pickDriver}</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name || d.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Days */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t.shopSchedule.days}</p>
          <WeekdayPicker value={days} onChange={setDays} />
        </div>

        <p className="text-xs text-muted-foreground">{t.shopSchedule.note}</p>
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>
        )}

        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground disabled:opacity-50"
        >
          {busy ? t.common.saving : t.shopSchedule.create}
        </button>
      </div>

      {/* Existing schedules */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
            {t.shopSchedule.none}
          </p>
        ) : (
          schedules.map((s) => (
            <div key={s.id} className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold">
                    {s.customer_name || "—"}{" "}
                    <span className="text-xs font-normal text-muted-foreground" dir="ltr">
                      {s.customer_phone}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t.shopSchedule.driver}: {s.driver_name || "—"}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-brand">{dayNames(s.weekdays)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                    s.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.active ? t.shopSchedule.activeLabel : t.shopSchedule.pausedLabel}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => toggle(s.id, !s.active)}
                  className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-bold text-brand"
                >
                  {s.active ? t.shopSchedule.pause : t.shopSchedule.resume}
                </button>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="rounded-xl border border-danger px-4 py-2 text-sm font-bold text-danger"
                >
                  {t.shopSchedule.remove}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
