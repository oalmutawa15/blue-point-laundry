"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import type { OrderStatus } from "@/types/database";

const STYLES: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  pickup_requested: "bg-sky-100 text-sky-800",
  picked_up: "bg-sky-100 text-sky-800",
  counting: "bg-indigo-100 text-indigo-800",
  awaiting_payment: "bg-violet-100 text-violet-800",
  washing: "bg-blue-100 text-blue-800",
  ready: "bg-cyan-100 text-cyan-800",
  delivering: "bg-teal-100 text-teal-800",
  delivered: "bg-green-100 text-green-800",
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
