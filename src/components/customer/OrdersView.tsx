"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { useRealtimeOrders } from "@/lib/useRealtimeOrders";
import { OrderCard } from "./OrderCard";
import { formatMoney } from "@/lib/money";
import type { Tables } from "@/types/database";

type Filter = "all" | "progress" | "completed" | "cancelled";

export function OrdersView({
  orders,
  creditFils,
}: {
  orders: Tables<"orders">[];
  creditFils: number;
}) {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<Filter>("all");
  useRealtimeOrders("customer");

  const match = (o: Tables<"orders">) => {
    if (filter === "all") return true;
    if (filter === "completed") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return !["delivered", "cancelled"].includes(o.status); // progress
  };
  const list = orders.filter(match);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: t.orders.all },
    { key: "progress", label: t.orders.inProgress },
    { key: "completed", label: t.orders.completed },
    { key: "cancelled", label: t.orders.cancelled },
  ];

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <div className="rounded-3xl bg-gradient-to-b from-brand to-brand-800 p-6 text-center text-brand-foreground shadow-sm">
        <p className="text-sm text-white/80">{t.credit.balance}</p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums">{formatMoney(creditFils, lang)}</p>
      </div>

      {/* Filter tabs */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setFilter(tb.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              filter === tb.key ? "bg-brand text-brand-foreground" : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
          {t.orders.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
