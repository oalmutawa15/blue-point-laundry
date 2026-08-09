"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { formatAddress, mapsUrl } from "@/lib/address";
import { markPickedUp, markDelivered } from "@/app/actions/driver";
import type { Tables } from "@/types/database";
import type { CustomerLite } from "@/lib/orderTypes";

const AddressMap = dynamic(() => import("@/components/AddressMap"), { ssr: false });

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
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isPickup =
    order.pickup_driver_id === currentUserId && order.status === "pickup_requested";
  const isDelivery =
    order.delivery_driver_id === currentUserId && order.status === "delivering";

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

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
          <div className="mt-3 rounded-xl bg-muted px-3 py-2.5">
            <p className="text-xs font-semibold text-muted-foreground">{t.orders.pickupAddress}</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">
              {formatAddress(address, lang)}
            </p>
          </div>
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
            className="mt-3 block rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-bold text-brand-foreground"
          >
            {t.common.googleMaps}
          </a>
        )}
      </div>

      {address?.lat != null && address?.lng != null && (
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t.common.locationMap}</p>
          <AddressMap lat={address.lat} lng={address.lng} />
        </div>
      )}

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
        <div className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPickPhoto}
            className="hidden"
          />
          {photo ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={t.driver.deliveryPhoto} className="max-h-64 w-full object-cover" />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full bg-card py-2 text-sm font-semibold text-brand"
              >
                {t.driver.retakePhoto}
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-6 text-sm font-bold text-muted-foreground"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3.5" /></svg>
              {t.driver.takePhoto}
            </button>
          )}
          <button
            onClick={() => act(() => markDelivered(order.id, photo ?? undefined))}
            disabled={busy || !photo}
            className="w-full rounded-xl bg-success px-4 py-3.5 text-base font-bold text-white disabled:opacity-50"
          >
            {busy ? t.common.loading : t.driver.markDelivered}
          </button>
          {!photo && (
            <p className="text-center text-xs text-muted-foreground">{t.driver.photoRequired}</p>
          )}
        </div>
      )}
    </div>
  );
}
