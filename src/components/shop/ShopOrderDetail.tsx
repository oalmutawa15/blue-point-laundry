"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { ShopOrderActions } from "./ShopOrderActions";
import { formatMoney } from "@/lib/money";
import { formatAddress, mapsUrl } from "@/lib/address";
import { PREF_GROUPS, prefLabel, type Preferences } from "@/lib/preferences";
import type { Tables } from "@/types/database";
import type { CustomerLite, DriverLite } from "@/lib/orderTypes";

const AddressMap = dynamic(() => import("@/components/AddressMap"), { ssr: false });

export function ShopOrderDetail({
  order,
  customer,
  address,
  items,
  events,
  drivers,
}: {
  order: Tables<"orders">;
  customer: CustomerLite;
  address: Tables<"addresses"> | null;
  items: Tables<"order_items">[];
  events: Tables<"order_events">[];
  drivers: DriverLite[];
}) {
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar-KW" : "en-GB";

  // The customer's saved laundry preferences (starch, ironing, etc.) + notes.
  const prefs = (customer?.preferences ?? {}) as Preferences;
  const prefRows = PREF_GROUPS.map((g) => ({
    label: lang === "ar" ? g.ar : g.en,
    value: prefLabel(g.key, prefs[g.key], lang),
  })).filter((r) => r.value);
  const hasPrefs = prefRows.length > 0 || !!prefs.notes?.trim();
  const sortedEvents = [...events].sort(
    (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/shop" className="text-muted-foreground">
          <svg className="h-6 w-6 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <h1 className="text-xl font-extrabold tabular-nums">{order.order_no}</h1>
        <div className="ms-auto">
          <OrderStatusBadge status={order.status} fulfillment={order.fulfillment} />
        </div>
      </div>

      {/* Customer + address */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">{t.shop.customer}</p>
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
            className="mt-3 block rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-bold text-brand-foreground"
          >
            {t.common.googleMaps}
          </a>
        )}
      </div>

      {/* Customer's saved laundry preferences */}
      {hasPrefs && (
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t.preferences.title}</p>
          <div className="space-y-1.5">
            {prefRows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-bold">{r.value}</span>
              </div>
            ))}
            {prefs.notes?.trim() && (
              <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">{prefs.notes}</p>
            )}
          </div>
        </div>
      )}

      {address?.lat != null && address?.lng != null && (
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t.common.locationMap}</p>
          <AddressMap lat={address.lat} lng={address.lng} />
        </div>
      )}

      {/* Items */}
      {items.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">{t.orders.items}</h2>
            {order.price_fils != null && (
              <span className="font-extrabold tabular-nums">
                {formatMoney(order.price_fils, lang)}
              </span>
            )}
          </div>
          <div className="divide-y divide-border">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {it.qty}× {it.garment || t.shop.services[it.service as "wash"] || it.service}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatMoney(it.unit_price_fils * it.qty, lang)}
                </span>
              </div>
            ))}
          </div>
          {order.delivery_date && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t.shop.deliveryDate}:{" "}
              {new Date(order.delivery_date).toLocaleDateString(locale)}
            </p>
          )}
        </div>
      )}

      {/* Delivery proof photo */}
      {order.delivery_photo_url && (
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="mb-2 font-bold">{t.driver.deliveryPhoto}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.delivery_photo_url}
            alt={t.driver.deliveryPhoto}
            className="w-full rounded-xl object-cover"
          />
        </div>
      )}

      {/* Action panel */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <ShopOrderActions order={order} items={items} drivers={drivers} />
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-bold">{t.orders.timeline}</h2>
        <ol className="relative space-y-4 ps-5">
          {sortedEvents.map((e, i) => (
            <li key={e.id} className="relative">
              <span
                className={`absolute -start-5 top-1 h-3 w-3 rounded-full ${
                  i === sortedEvents.length - 1 ? "bg-brand" : "bg-border"
                }`}
              />
              {i < sortedEvents.length - 1 && (
                <span className="absolute -start-[15px] top-3 h-full w-px bg-border" />
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.status[e.status]}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString(locale, {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
