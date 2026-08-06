"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatAddress, mapsUrl } from "@/lib/address";
import type { OrderWithRelations } from "@/lib/orderTypes";

function JobCard({ order, kind }: { order: OrderWithRelations; kind: "pickup" | "delivery" }) {
  const { t, lang } = useLang();
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-extrabold tabular-nums">{order.order_no}</span>
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
    </div>
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
  const empty = pickups.length === 0 && deliveries.length === 0;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{t.driver.title}</h1>

      {empty && (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
          {t.driver.noJobs}
        </p>
      )}

      {pickups.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold">{t.driver.pickups}</h2>
          {pickups.map((o) => (
            <JobCard key={o.id} order={o} kind="pickup" />
          ))}
        </section>
      )}

      {deliveries.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold">{t.driver.deliveries}</h2>
          {deliveries.map((o) => (
            <JobCard key={o.id} order={o} kind="delivery" />
          ))}
        </section>
      )}
    </div>
  );
}
