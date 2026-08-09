"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { formatAddress } from "@/lib/address";
import { formatMoney } from "@/lib/money";
import type { OrderWithRelations } from "@/lib/orderTypes";
import type { OrderStatus } from "@/types/database";

// Every order phase, in flow order.
const PHASES: OrderStatus[] = [
  "new",
  "pickup_requested",
  "picked_up",
  "counting",
  "awaiting_payment",
  "washing",
  "ready",
  "delivering",
  "delivered",
  "cancelled",
];

export function ShopOrderList({ orders }: { orders: OrderWithRelations[] }) {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const countFor = (f: "all" | OrderStatus) =>
    f === "all" ? orders.length : orders.filter((o) => o.status === f).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t.shop.title}</h1>
        <Link
          href="/shop/create"
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          {t.pos.newWalkIn}
        </Link>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          {t.shop.filterByStatus}
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | OrderStatus)}
          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-brand sm:w-72"
        >
          <option value="all">
            {t.shop.all} ({countFor("all")})
          </option>
          {PHASES.map((p) => (
            <option key={p} value={p}>
              {t.status[p]} ({countFor(p)})
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
          {t.shop.noOrders}
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <Link
              key={o.id}
              href={`/shop/orders/${o.id}`}
              className="block rounded-2xl bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold tabular-nums">{o.order_no}</span>
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="mt-2 text-sm">
                <p className="font-semibold">
                  {o.customer?.full_name || o.customer?.phone || "—"}
                </p>
                {o.pickup_address && (
                  <p className="text-muted-foreground">
                    {formatAddress(o.pickup_address, lang)}
                  </p>
                )}
              </div>
              {o.price_fils != null && (
                <p className="mt-1 text-sm font-bold">
                  {formatMoney(o.price_fils, lang)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
