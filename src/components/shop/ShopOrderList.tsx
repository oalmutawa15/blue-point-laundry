"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { formatAddress } from "@/lib/address";
import { formatMoney } from "@/lib/money";
import type { OrderWithRelations } from "@/lib/orderTypes";

type Tab = "new" | "active" | "done";

export function ShopOrderList({ orders }: { orders: OrderWithRelations[] }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>("new");

  const groups: Record<Tab, OrderWithRelations[]> = {
    new: orders.filter((o) => o.status === "requested"),
    active: orders.filter(
      (o) => !["requested", "completed", "cancelled"].includes(o.status),
    ),
    done: orders.filter((o) => ["completed", "cancelled"].includes(o.status)),
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "new", label: t.shop.newOrders },
    { key: "active", label: t.shop.active },
    { key: "done", label: t.shop.completed },
  ];

  const list = groups[tab];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t.shop.title}</h1>

      <div className="flex gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
              tab === tb.key
                ? "bg-brand text-brand-foreground"
                : "bg-card text-muted-foreground"
            }`}
          >
            {tb.label}
            <span
              className={`rounded-full px-1.5 text-xs ${
                tab === tb.key ? "bg-white/20" : "bg-muted"
              }`}
            >
              {groups[tb.key].length}
            </span>
          </button>
        ))}
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
