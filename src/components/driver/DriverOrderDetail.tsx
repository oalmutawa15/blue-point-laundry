"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { formatAddress, mapsUrl } from "@/lib/address";
import { markPickedUp, markDelivered, returnDelivery } from "@/app/actions/driver";
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

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await compressImage(file));
    } catch {
      // Fallback to the raw file if compression fails for any reason.
      const reader = new FileReader();
      reader.onload = () => setPhoto(typeof reader.result === "string" ? reader.result : null);
      reader.readAsDataURL(file);
    }
  }

  async function act(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    try {
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
    } catch {
      // e.g. the photo was too large / network failed — surface it instead of
      // leaving the button stuck on "Loading…".
      setBusy(false);
      setError(t.driver.photoTooLarge);
    }
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
          <div className="mt-1 flex items-center gap-2">
            <a href={`tel:${customer.phone}`} dir="ltr" className="text-sm font-bold text-brand">
              {customer.phone}
            </a>
            <a
              href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24s8.24 3.7 8.24 8.24-3.7 8.24-8.24 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29" /></svg>
              {t.driver.whatsapp}
            </a>
          </div>
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

          {/* Couldn't deliver → return the order to the shop for re-dispatch. */}
          <button
            onClick={() => {
              if (window.confirm(t.driver.returnConfirm)) act(() => returnDelivery(order.id));
            }}
            disabled={busy}
            className="w-full rounded-xl border border-danger px-4 py-3 text-sm font-bold text-danger disabled:opacity-50"
          >
            {t.driver.returnToShop}
          </button>
          <p className="text-center text-xs text-muted-foreground">{t.driver.returnHint}</p>
        </div>
      )}
    </div>
  );
}

// Resize + JPEG-compress a camera photo in the browser so the upload stays small
// (a raw phone photo can be several MB — far over the server action's limit,
// which is what left the button stuck on "Loading…").
async function compressImage(file: File, maxDim = 1280, quality = 0.7): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read_failed"));
    r.readAsDataURL(file);
  });
  const img = document.createElement("img");
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("decode_failed"));
    img.src = dataUrl;
  });
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
