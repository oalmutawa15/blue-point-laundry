"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatMoney } from "@/lib/money";
import { formatAddress } from "@/lib/address";
import type { Tables } from "@/types/database";

export function OrderDetail({
  order,
  address,
  items,
  events,
}: {
  order: Tables<"orders">;
  address: Tables<"addresses"> | null;
  items: Tables<"order_items">[];
  events: Tables<"order_events">[];
}) {
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar-KW" : "en-GB";
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  const fmtTime = (s: string) =>
    new Date(s).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const sortedEvents = [...events].sort(
    (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
  );

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/orders" className="rounded-full p-1 text-muted-foreground">
          <svg className="h-6 w-6 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <h1 className="text-xl font-extrabold tabular-nums">{order.order_no}</h1>
        <div className="ms-auto">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Summary */}
      <div className="divide-y divide-border rounded-2xl bg-card px-4 shadow-sm">
        <Row label={t.orders.requestedAt} value={fmtDate(order.created_at)} />
        {address && (
          <Row label={t.orders.pickupAddress} value={formatAddress(address, lang)} />
        )}
        <Row
          label={t.orders.pieces}
          value={order.piece_count ?? "—"}
        />
        <Row
          label={t.orders.price}
          value={
            order.price_fils != null ? formatMoney(order.price_fils, lang) : t.orders.notPricedYet
          }
        />
        {order.delivery_date && (
          <Row label={t.orders.deliveryDate} value={fmtDate(order.delivery_date)} />
        )}
        {order.customer_note && <Row label={t.orders.note} value={order.customer_note} />}
      </div>

      {/* Items */}
      {items.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="mb-2 font-bold">{t.orders.items}</h2>
          <div className="divide-y divide-border">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {it.qty}× {it.garment || it.service}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(it.unit_price_fils * it.qty, lang)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-bold">{t.orders.timeline}</h2>
        <ol className="relative space-y-4 ps-5">
          {sortedEvents.map((e, i) => (
            <li key={e.id} className="relative">
              <span
                className={`absolute -start-5 top-1 h-3 w-3 rounded-full ${
                  i === sortedEvents.length - 1 ? "bg-brand" : "bg-border"
                }`}
              />
              {i < sortedEvents.length - 1 && (
                <span className="absolute -start-[15px] top-3 h-full w-px bg-border" />
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.status[e.status]}</span>
                <span className="text-xs text-muted-foreground">{fmtTime(e.created_at)}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
