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
