"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { kwdToFils, filsToKwd, formatMoney } from "@/lib/money";
import {
  allPriceItems,
  priceForItem,
  type FlatPriceItem,
  type PriceService,
} from "@/lib/priceList";
import Link from "next/link";
import {
  assignPickupDriver,
  assignDeliveryDriver,
  saveIntake,
  markReceived,
  confirmPayment,
  markReady,
  cancelOrder,
  type ItemInput,
} from "@/app/actions/shop";
import type { Tables } from "@/types/database";
import type { DriverLite } from "@/lib/orderTypes";

type ItemRow = {
  garment: string;
  item: FlatPriceItem | null;
  service: PriceService;
  qty: number;
  priceKwd: string;
};

const SERVICES: PriceService[] = ["wash", "dryclean", "iron"];

// Searchable item picker backed by the Blue Point price list.
function ItemPicker({
  value,
  onText,
  onSelect,
}: {
  value: string;
  onText: (text: string) => void;
  onSelect: (item: FlatPriceItem) => void;
}) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = (o: { en: string; ar: string }) => (lang === "ar" ? o.ar : o.en);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const q = value.trim().toLowerCase();
  const items = allPriceItems();
  const filtered = q
    ? items.filter((it) => it.en.toLowerCase().includes(q) || it.ar.includes(value.trim()))
    : items;

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={(e) => {
          onText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={t.shop.garmentPlaceholder}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {open && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-xl">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t.shop.noMatch}</li>
          )}
          {filtered.map((it) => (
            <li key={`${it.categoryKey}-${it.key}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(it);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm hover:bg-muted"
              >
                <span className="font-medium">{name(it)}</span>
                <span className="text-xs text-muted-foreground">
                  {lang === "ar" ? it.categoryAr : it.categoryEn}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DriverPicker({
  drivers,
  onAssign,
  label,
}: {
  drivers: DriverLite[];
  onAssign: (driverId: string) => Promise<void>;
  label: string;
}) {
  const { t } = useLang();
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3">
      <p className="font-bold">{label}</p>
      <select
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
        className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm outline-none focus:border-brand"
      >
        {drivers.length === 0 && <option value="">—</option>}
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.full_name || d.phone}
          </option>
        ))}
      </select>
      <button
        onClick={async () => {
          if (!driverId) return;
          setBusy(true);
          await onAssign(driverId);
        }}
        disabled={busy || !driverId}
        className="w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground disabled:opacity-50"
      >
        {busy ? t.common.loading : t.shop.assign}
      </button>
    </div>
  );
}

function IntakeForm({ orderId }: { orderId: string }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const emptyRow: ItemRow = { garment: "", item: null, service: "wash", qty: 1, priceKwd: "" };
  const [rows, setRows] = useState<ItemRow[]>([{ ...emptyRow }]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [busy, setBusy] = useState(false);

  const total = rows.reduce(
    (s, r) => s + (r.qty || 0) * kwdToFils(r.priceKwd || "0"),
    0,
  );

  function update(i: number, patch: Partial<ItemRow>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  // Auto-fill the price from the price list for the given item + service.
  function autoPriceKwd(item: FlatPriceItem | null, service: PriceService): string | null {
    if (!item) return null;
    const fils = priceForItem(item, service);
    return fils == null ? null : filsToKwd(fils);
  }

  function pickItem(i: number, item: FlatPriceItem) {
    const name = lang === "ar" ? item.ar : item.en;
    const price = autoPriceKwd(item, rows[i].service);
    update(i, { item, garment: name, ...(price != null ? { priceKwd: price } : {}) });
  }

  function changeService(i: number, service: PriceService) {
    const price = autoPriceKwd(rows[i].item, service);
    update(i, { service, ...(price != null ? { priceKwd: price } : {}) });
  }

  async function submit() {
    const items: ItemInput[] = rows
      .filter((r) => r.qty > 0)
      .map((r) => ({
        garment: r.garment,
        service: r.service,
        qty: r.qty,
        unit_price_fils: kwdToFils(r.priceKwd || "0"),
      }));
    setBusy(true);
    await saveIntake(orderId, items, deliveryDate || null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="font-bold">{t.shop.intake}</p>

      {rows.map((r, i) => (
        <div key={i} className="rounded-xl border border-border p-3">
          <div className="mb-2">
            <ItemPicker
              value={r.garment}
              onText={(text) => update(i, { garment: text, item: null })}
              onSelect={(item) => pickItem(i, item)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={r.service}
              onChange={(e) => changeService(i, e.target.value as PriceService)}
              className="rounded-lg border border-border bg-white px-2 py-2 text-sm outline-none focus:border-brand"
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {t.shop.services[s]}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={r.qty}
              onChange={(e) => update(i, { qty: parseInt(e.target.value) || 0 })}
              aria-label={t.shop.qty}
              className="rounded-lg border border-border bg-white px-2 py-2 text-center text-sm tabular-nums outline-none focus:border-brand"
            />
            <input
              inputMode="decimal"
              value={r.priceKwd}
              onChange={(e) =>
                update(i, { priceKwd: e.target.value.replace(/[^\d.]/g, "") })
              }
              placeholder={t.shop.unitPrice}
              className="rounded-lg border border-border bg-white px-2 py-2 text-center text-sm tabular-nums outline-none focus:border-brand"
            />
          </div>
          {rows.length > 1 && (
            <button
              onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
              className="mt-2 text-xs font-semibold text-danger"
            >
              {t.common.delete}
            </button>
          )}
        </div>
      ))}

      <button
        onClick={() => setRows((rs) => [...rs, { ...emptyRow }])}
        className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm font-semibold text-brand"
      >
        + {t.shop.addItem}
      </button>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">
          {t.shop.deliveryDate}
        </label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
        <span className="font-bold">{t.shop.total}</span>
        <span className="font-extrabold tabular-nums">{formatMoney(total, lang)}</span>
      </div>

      <button
        onClick={submit}
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground disabled:opacity-50"
      >
        {busy ? t.common.saving : t.shop.sendToCustomer}
      </button>
    </div>
  );
}

export function ShopOrderActions({
  order,
  drivers,
}: {
  order: Tables<"orders">;
  drivers: DriverLite[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    if (!res.ok) {
      setBusy(false);
      setError(res.error === "insufficient_credit" ? t.shop.customerNoCredit : (res.error ?? "error"));
      return;
    }
    router.refresh();
  }

  const info = (text: string) => (
    <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">{text}</p>
  );

  const primaryBtn = (label: string, fn: () => Promise<{ ok: boolean; error?: string }>) => (
    <div className="space-y-2">
      <button
        onClick={() => run(fn)}
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground disabled:opacity-50"
      >
        {busy ? t.common.loading : label}
      </button>
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
    </div>
  );

  const statusAction = (() => {
    switch (order.status) {
      case "new":
        return (
          <DriverPicker
            drivers={drivers}
            label={t.shop.assignPickup}
            onAssign={async (id) => {
              await assignPickupDriver(order.id, id);
              router.refresh();
            }}
          />
        );
      case "pickup_requested":
        return info(`${t.status.pickup_requested} — ${t.driver.pickups}`);
      case "picked_up":
        return primaryBtn(t.shop.markReceived, () => markReceived(order.id));
      case "counting":
        return <IntakeForm orderId={order.id} />;
      case "awaiting_payment":
        return primaryBtn(t.shop.confirmPayment, () => confirmPayment(order.id));
      case "washing":
        return primaryBtn(t.shop.markReadyBtn, () => markReady(order.id));
      case "ready":
        return (
          <DriverPicker
            drivers={drivers}
            label={t.shop.assignDelivery}
            onAssign={async (id) => {
              await assignDeliveryDriver(order.id, id);
              router.refresh();
            }}
          />
        );
      case "delivering":
        return info(t.status.delivering);
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-4">
      {statusAction}

      {order.status === "cancelled" ? (
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
          <p className="text-sm font-bold text-muted-foreground">{t.status.cancelled}</p>
          <Link
            href={`/shop/orders/${order.id}/receipt`}
            className="mt-2 inline-block rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground"
          >
            {t.shop.viewRefund}
          </Link>
        </div>
      ) : (
        <CancelBox order={order} />
      )}
    </div>
  );
}

function CancelBox({ order }: { order: Tables<"orders"> }) {
  const { t } = useLang();
  const router = useRouter();
  const [openBox, setOpenBox] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doCancel() {
    setBusy(true);
    setError(null);
    const res = await cancelOrder(order.id, reason);
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    router.push(`/shop/orders/${order.id}/receipt`);
    router.refresh();
  }

  if (!openBox) {
    return (
      <button
        type="button"
        onClick={() => setOpenBox(true)}
        className="w-full rounded-xl border border-danger/40 py-2.5 text-sm font-bold text-danger"
      >
        {t.shop.cancelOrder}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-danger/40 p-3">
      <p className="text-sm font-bold text-danger">{t.shop.cancelOrder}</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t.shop.cancelReason}
        rows={2}
        className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={doCancel}
          disabled={busy}
          className="flex-1 rounded-lg bg-danger px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? t.common.loading : t.shop.confirmCancel}
        </button>
        <button
          onClick={() => setOpenBox(false)}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold"
        >
          {t.common.cancel}
        </button>
      </div>
    </div>
  );
}
