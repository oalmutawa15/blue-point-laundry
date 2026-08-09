"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { RequestPickup } from "./RequestPickup";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatMoney } from "@/lib/money";
import { formatAddress } from "@/lib/address";
import type { Tables } from "@/types/database";

export function HomeView({
  addresses,
  activeOrder,
  creditFils,
}: {
  addresses: Tables<"addresses">[];
  activeOrder: Tables<"orders"> | null;
  creditFils: number;
}) {
  const { t, lang } = useLang();
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  return (
    <div className="space-y-5">
      <RequestPickup addresses={addresses} />

      {/* Current order status */}
      <Link
        href={activeOrder ? `/orders/${activeOrder.id}` : "/orders"}
        className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{t.home.currentStatus}</p>
          {activeOrder ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="truncate text-sm font-bold">{activeOrder.order_no}</span>
              <OrderStatusBadge status={activeOrder.status} />
            </div>
          ) : (
            <p className="mt-0.5 text-sm font-bold">{t.home.noRequest}</p>
          )}
        </div>
        <svg className="h-5 w-5 shrink-0 text-muted-foreground rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </Link>

      {/* Balance + pickup address */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/credit" className="rounded-2xl bg-card p-4 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>
          </span>
          <p className="mt-2 text-xs text-muted-foreground">{t.home.manageBalance}</p>
          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-brand">{formatMoney(creditFils, lang)}</p>
        </Link>

        <Link href="/addresses" className="rounded-2xl bg-card p-4 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
          </span>
          <p className="mt-2 text-xs text-muted-foreground">{t.home.pickupAddress}</p>
          <p className="mt-0.5 truncate text-sm font-bold">
            {defaultAddress ? formatAddress(defaultAddress, lang) : "—"}
          </p>
        </Link>
      </div>
    </div>
  );
}
