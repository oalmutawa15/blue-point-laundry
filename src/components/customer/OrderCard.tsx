"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatMoney } from "@/lib/money";
import type { Tables } from "@/types/database";

export function OrderCard({ order }: { order: Tables<"orders"> }) {
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar-KW" : "en-GB";
  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-2xl bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="font-extrabold tabular-nums">{order.order_no}</span>
        <OrderStatusBadge status={order.status} fulfillment={order.fulfillment} />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>{new Date(order.created_at).toLocaleDateString(locale)}</span>
        {order.price_fils != null ? (
          <span className="font-bold text-foreground">
            {formatMoney(order.price_fils, lang)}
          </span>
        ) : (
          <span>{t.orders.notPricedYet}</span>
        )}
      </div>
    </Link>
  );
}
