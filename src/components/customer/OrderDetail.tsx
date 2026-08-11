"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderProgress } from "./OrderProgress";
import { useRealtimeOrders } from "@/lib/useRealtimeOrders";
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
  useRealtimeOrders("order-detail");
  const locale = lang === "ar" ? "ar-KW" : "en-GB";
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

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
          <OrderStatusBadge status={order.status} fulfillment={order.fulfillment} />
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

      {/* Delivery proof photo */}
      {order.delivery_photo_url && (
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="mb-2 font-bold">{t.driver.deliveryPhoto}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.delivery_photo_url}
            alt={t.driver.deliveryPhoto}
            className="w-full rounded-xl object-cover"
          />
        </div>
      )}

      {/* Full stage-by-stage progress — same stages the shop works through */}
      <OrderProgress status={order.status} events={events} fulfillment={order.fulfillment} />
    </div>
  );
}
