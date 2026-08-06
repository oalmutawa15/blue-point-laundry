"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { OrderCard } from "./OrderCard";
import type { Tables } from "@/types/database";

export function OrdersView({ orders }: { orders: Tables<"orders">[] }) {
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t.orders.title}</h1>
      {orders.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
          {t.orders.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
