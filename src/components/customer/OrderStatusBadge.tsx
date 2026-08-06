"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import type { OrderStatus } from "@/types/database";

const STYLES: Record<OrderStatus, string> = {
  requested: "bg-amber-100 text-amber-800",
  pickup_assigned: "bg-sky-100 text-sky-800",
  picked_up: "bg-sky-100 text-sky-800",
  at_shop: "bg-indigo-100 text-indigo-800",
  priced: "bg-violet-100 text-violet-800",
  processing: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-teal-100 text-teal-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLang();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${STYLES[status]}`}
    >
      {t.status[status]}
    </span>
  );
}
