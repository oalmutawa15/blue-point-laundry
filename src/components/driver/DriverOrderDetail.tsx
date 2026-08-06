"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { formatAddress, mapsUrl } from "@/lib/address";
import { markPickedUp, markDelivered } from "@/app/actions/driver";
import type { Tables } from "@/types/database";
import type { CustomerLite } from "@/lib/orderTypes";

export function DriverOrderDetail({
  order,
  customer,
  address,
  currentUserId,
}: {
  order: Tables<"orders">;
  customer: CustomerLite;
  address: Tables<"addresses"> | null;
  currentUserId: string;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPickup =
    order.pickup_driver_id === currentUserId && order.status === "pickup_assigned";
  const isDelivery =
    order.delivery_driver_id === currentUserId && order.status === "out_for_delivery";

  async function act(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    if (!res.ok) {
      setBusy(false);
      setError(
        res.error === "insufficient_credit"
          ? t.driver.insufficientCredit
          : res.error ?? "error",
      );
      return;
    }
    router.replace("/driver");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/driver" className="text-muted-foreground">
          <svg className="h-6 w-6 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <h1 className="text-xl font-extrabold tabular-nums">{order.order_no}</h1>
        <div className="ms-auto">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">
          {isDelivery ? t.driver.deliverTo : t.driver.pickupFrom}
        </p>
        <p className="font-bold">{customer?.full_name || customer?.phone || "—"}</p>
        {customer?.phone && (
          <a href={`tel:${customer.phone}`} dir="ltr" className="text-sm text-brand">
            {customer.phone}
          </a>
        )}
        {address && (
          <p className="mt-2 text-sm text-muted-foreground">
            {formatAddress(address, lang)}
          </p>
        )}
        {order.customer_note && (
          <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">
            {order.customer_note}
          </p>
        )}
        {address && (
          <a
            href={mapsUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold text-brand"
          >
            {t.driver.openMap}
          </a>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {isPickup && (
        <button
          onClick={() => act(() => markPickedUp(order.id))}
          disabled={busy}
          className="w-full rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground disabled:opacity-50"
        >
          {busy ? t.common.loading : t.driver.markPickedUp}
        </button>
      )}
      {isDelivery && (
        <button
          onClick={() => act(() => markDelivered(order.id))}
          disabled={busy}
          className="w-full rounded-xl bg-success px-4 py-3.5 text-base font-bold text-white disabled:opacity-50"
        >
          {busy ? t.common.loading : t.driver.markDelivered}
        </button>
      )}
    </div>
  );
}
