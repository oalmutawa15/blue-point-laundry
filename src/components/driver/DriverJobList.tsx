"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { useRealtimeOrders } from "@/lib/useRealtimeOrders";
import { formatAddress, mapsUrl } from "@/lib/address";
import { markPickedUp } from "@/app/actions/driver";
import { isLate, kuwaitToday } from "@/lib/lateness";
import { routeOrders } from "@/lib/driverRoute";
import type { OrderWithRelations } from "@/lib/orderTypes";

function JobCard({ order, kind }: { order: OrderWithRelations; kind: "pickup" | "delivery" }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const late = order.dispatch_late || isLate(order.dispatch_date, order.status);
  const area = order.pickup_address?.area;

  async function pickUp() {
    setBusy(true);
    setError(null);
    const res = await markPickedUp(order.id);
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className={`rounded-2xl bg-card p-4 shadow-sm ${late ? "ring-2 ring-danger" : ""}`}>
      {/* Area on top, bold — so the driver reads the destination first */}
      {area && <p className="text-base font-extrabold text-brand">{area}</p>}

      <div className="mt-1 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="font-extrabold tabular-nums">{order.order_no}</span>
          {late && (
            <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
              {t.orders.late}
            </span>
          )}
        </span>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
          {kind === "pickup" ? t.driver.pickupFrom : t.driver.deliverTo}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold">
        {order.customer?.full_name || order.customer?.phone || "—"}
      </p>
      {order.pickup_address && (
        <p className="text-sm text-muted-foreground">
          {formatAddress(order.pickup_address, lang)}
        </p>
      )}

      {/* Customer phone + Call / WhatsApp buttons. */}
      {order.customer?.phone && (
        <div className="mt-2">
          <p dir="ltr" className="text-sm font-bold text-brand">{order.customer.phone}</p>
          <div className="mt-1.5 flex gap-2">
            <a
              href={`tel:${order.customer.phone}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>
              {t.driver.call}
            </a>
            <a
              href={`https://wa.me/${order.customer.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24s8.24 3.7 8.24 8.24-3.7 8.24-8.24 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29" /></svg>
              {t.driver.whatsapp}
            </a>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Link
          href={`/driver/orders/${order.id}`}
          className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-bold text-brand-foreground"
        >
          {t.orders.details}
        </Link>
        {order.pickup_address && (
          <a
            href={mapsUrl(order.pickup_address)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold text-brand"
          >
            {t.driver.openMap}
          </a>
        )}
      </div>

      {/* Pickup drivers can confirm collection straight from the card. */}
      {kind === "pickup" && (
        <button
          type="button"
          onClick={pickUp}
          disabled={busy}
          className="mt-2 w-full rounded-xl bg-success px-4 py-2.5 text-center text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? t.common.loading : t.driver.markPickedUp}
        </button>
      )}
      {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}

function DaySection({
  title,
  pickups,
  deliveries,
}: {
  title: string;
  pickups: OrderWithRelations[];
  deliveries: OrderWithRelations[];
}) {
  const { t } = useLang();
  if (pickups.length === 0 && deliveries.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-extrabold">{title}</h2>
      {pickups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground">{t.driver.pickups}</h3>
          {routeOrders(pickups).map((o) => (
            <JobCard key={o.id} order={o} kind="pickup" />
          ))}
        </div>
      )}
      {deliveries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground">{t.driver.deliveries}</h3>
          {routeOrders(deliveries).map((o) => (
            <JobCard key={o.id} order={o} kind="delivery" />
          ))}
        </div>
      )}
    </section>
  );
}

export function DriverJobList({
  pickups,
  deliveries,
}: {
  pickups: OrderWithRelations[];
  deliveries: OrderWithRelations[];
}) {
  const { t } = useLang();
  useRealtimeOrders("driver");

  // "Tomorrow" = dispatch day is strictly after today; everything else (today,
  // overdue, or legacy no-date) is "Today".
  const today = kuwaitToday();
  const isTomorrow = (o: OrderWithRelations) => !!o.dispatch_date && o.dispatch_date > today;

  const todayPickups = pickups.filter((o) => !isTomorrow(o));
  const tomorrowPickups = pickups.filter(isTomorrow);
  const todayDeliveries = deliveries.filter((o) => !isTomorrow(o));
  const tomorrowDeliveries = deliveries.filter(isTomorrow);

  const empty = pickups.length === 0 && deliveries.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">{t.driver.title}</h1>

      {empty && (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
          {t.driver.noJobs}
        </p>
      )}

      <DaySection title={t.driver.today} pickups={todayPickups} deliveries={todayDeliveries} />
      <DaySection title={t.driver.tomorrow} pickups={tomorrowPickups} deliveries={tomorrowDeliveries} />
    </div>
  );
}
