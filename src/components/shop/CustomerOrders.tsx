"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { useRealtimeOrders } from "@/lib/useRealtimeOrders";
import type { Tables } from "@/types/database";

type CustomerLite = Pick<Tables<"profiles">, "id" | "full_name" | "phone" | "credit_fils">;
type OrderLite = Pick<Tables<"orders">, "id" | "order_no" | "status" | "price_fils" | "created_at">;

export function CustomerOrders({
  customer,
  orders,
}: {
  customer: CustomerLite;
  orders: OrderLite[];
}) {
  const { t, lang } = useLang();
  useRealtimeOrders("customer-detail");
  const locale = lang === "ar" ? "ar-KW" : "en-GB";
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Customer header */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h1 className="text-xl font-extrabold">{customer.full_name || "—"}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">{customer.phone}</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-1.5 text-sm font-bold text-brand">
          {t.customers.walletBalance}: {formatMoney(customer.credit_fils, lang)}
        </div>
      </div>

      {/* Their orders with status */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-bold">{t.customers.customerOrders}</h2>
        {orders.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t.customers.noOrders}</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/shop/orders/${o.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="font-extrabold tabular-nums">{o.order_no}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {o.price_fils != null && (
                    <span className="text-sm font-bold tabular-nums">{formatMoney(o.price_fils, lang)}</span>
                  )}
                  <OrderStatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
