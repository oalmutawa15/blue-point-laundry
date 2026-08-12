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
  markPickedUp,
  setDispatchDate,
  cancelOrder,
  type ItemInput,
} from "@/app/actions/shop";
import { kuwaitToday } from "@/lib/lateness";
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

function IntakeForm({
  orderId,
  initialItems,
  initialDeliveryDate,
  onDone,
}: {
  orderId: string;
  initialItems?: Tables<"order_items">[];
  initialDeliveryDate?: string | null;
  onDone?: () => void;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const emptyRow: ItemRow = { garment: "", item: null, service: "wash", qty: 1, priceKwd: "" };
  const [rows, setRows] = useState<ItemRow[]>(() =>
    initialItems && initialItems.length
      ? initialItems.map((it) => ({
          garment: it.garment ?? "",
          item: null,
          service: (it.service as PriceService) ?? "wash",
          qty: it.qty,
          priceKwd: filsToKwd(it.unit_price_fils),
        }))
      : [{ ...emptyRow }],
  );
  const [deliveryDate, setDeliveryDate] = useState(initialDeliveryDate ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    if (!deliveryDate) {
      setError(t.shop.dateRequired);
      return;
    }
    const items: ItemInput[] = rows
      .filter((r) => r.qty > 0)
      .map((r) => ({
        garment: r.garment,
        service: r.service,
        qty: r.qty,
        unit_price_fils: kwdToFils(r.priceKwd || "0"),
      }));
    setBusy(true);
    const res = await saveIntake(orderId, items, deliveryDate);
    setBusy(false);
    if (!res.ok) {
      setError(res.error === "date_required" ? t.shop.dateRequired : res.error);
      return;
    }
    if (onDone) onDone();
    else router.refresh();
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
          {/* Per-line total = quantity × unit price, so the price visibly grows with qty. */}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground tabular-nums">
              {r.qty || 0} × {r.priceKwd || "0"}
            </span>
            <span className="font-extrabold tabular-nums">
              {formatMoney((r.qty || 0) * kwdToFils(r.priceKwd || "0"), lang)}
            </span>
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
          {t.shop.deliveryDate} <span className="text-danger">*</span>
        </label>
        <input
          type="date"
          required
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand ${
            error && !deliveryDate ? "border-danger" : "border-border"
          }`}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
        <span className="font-bold">{t.shop.total}</span>
        <span className="font-extrabold tabular-nums">{formatMoney(total, lang)}</span>
      </div>

      {error && <p className="text-sm font-semibold text-danger">{error}</p>}

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
  items,
  drivers,
}: {
  order: Tables<"orders">;
  items: Tables<"order_items">[];
  drivers: DriverLite[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    if (!res.ok) {
      setBusy(false);
      setError(
        res.error === "customer_in_debt"
          ? t.shop.customerInDebt
          : res.error === "insufficient_credit"
            ? t.shop.customerNoCredit
            : (res.error ?? "error"),
      );
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
        return editing ? (
          <div className="space-y-2">
            <IntakeForm
              orderId={order.id}
              initialItems={items}
              initialDeliveryDate={order.delivery_date}
              onDone={() => {
                setEditing(false);
                router.refresh();
              }}
            />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="w-full rounded-xl border border-border px-4 py-3 text-sm font-bold"
            >
              {t.customers.cancel}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {primaryBtn(t.shop.confirmPayment, () => confirmPayment(order.id))}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="w-full rounded-xl border border-border px-4 py-3 text-sm font-bold text-brand"
            >
              {t.shop.editOrder}
            </button>
          </div>
        );
      case "washing":
        return primaryBtn(
          order.fulfillment === "self_pickup" ? t.shop.markReadyPickupBtn : t.shop.markReadyBtn,
          () => markReady(order.id),
        );
      case "ready":
        // Self-pickup orders have no delivery-driver step: the customer collects
        // from the shop, and the shop marks it handed over.
        if (order.fulfillment === "self_pickup") {
          return (
            <div className="space-y-2">
              {info(t.shop.readyForPickupInfo)}
              {primaryBtn(t.shop.markPickedUp, () => markPickedUp(order.id))}
            </div>
          );
        }
        return (
          <div className="space-y-2">
            <DriverPicker
              drivers={drivers}
              label={t.shop.assignDelivery}
              onAssign={(id) => run(() => assignDeliveryDriver(order.id, id))}
            />
            {error && <p className="text-sm font-semibold text-danger">{error}</p>}
          </div>
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

      <DispatchControl order={order} />

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

// Dispatch-day control: the shop can set which Kuwait day the assigned driver
// sees this order. Shown once a driver leg is active (pickup_requested /
// delivering). Quick "today" / "make late" buttons make the flow testable.
function DispatchControl({ order }: { order: Tables<"orders"> }) {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(order.dispatch_date ?? kuwaitToday());

  // Only while a driver leg is active — once received at the shop / delivered,
  // the dispatch is done and this box disappears.
  const hasDriverLeg = order.status === "pickup_requested" || order.status === "delivering";
  if (!hasDriverLeg) return null;

  const shift = (days: number) => {
    const d = new Date(`${kuwaitToday()}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const tomorrow = shift(1);
  const yesterday = shift(-1);

  async function save(d: string) {
    setBusy(true);
    setDate(d);
    await setDispatchDate(order.id, d);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-4">
      <p className="text-sm font-bold">{t.shop.dispatchTitle}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t.shop.dispatchHint}</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => save(date)}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-brand-foreground disabled:opacity-50"
        >
          {t.customers.save}
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => save(tomorrow)}
          disabled={busy}
          className="flex-1 rounded-lg bg-brand-soft px-3 py-2 text-xs font-bold text-brand disabled:opacity-50"
        >
          {t.shop.showTomorrow}
        </button>
        <button
          type="button"
          onClick={() => save(kuwaitToday())}
          disabled={busy}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-bold text-brand disabled:opacity-50"
        >
          {t.shop.showToday}
        </button>
        <button
          type="button"
          onClick={() => save(yesterday)}
          disabled={busy}
          className="flex-1 rounded-lg border border-danger/40 px-3 py-2 text-xs font-bold text-danger disabled:opacity-50"
        >
          {t.shop.makeLate}
        </button>
      </div>
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

  // Only offer a refund choice when there's actually money to refund.
  const paid = order.charged === true && (order.price_fils ?? 0) > 0;

  async function doCancel(refund: boolean) {
    if (!reason.trim()) {
      setError(t.shop.reasonRequired);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await cancelOrder(order.id, reason, refund);
    if (!res.ok) {
      setBusy(false);
      setError(res.error === "reason_required" ? t.shop.reasonRequired : res.error);
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
    <div className="space-y-3 rounded-2xl border border-danger/40 p-3">
      <p className="text-sm font-bold text-danger">{t.shop.cancelOrder}</p>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">
          {t.shop.cancelReason} <span className="text-danger">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t.shop.cancelReasonPlaceholder}
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}

      {paid ? (
        <div className="space-y-2">
          <button
            onClick={() => doCancel(true)}
            disabled={busy}
            className="w-full rounded-lg bg-danger px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? t.common.loading : t.shop.cancelWithRefund}
          </button>
          <button
            onClick={() => doCancel(false)}
            disabled={busy}
            className="w-full rounded-lg border border-danger/50 px-4 py-2.5 text-sm font-bold text-danger disabled:opacity-50"
          >
            {t.shop.cancelNoRefund}
          </button>
          <button
            onClick={() => setOpenBox(false)}
            className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold"
          >
            {t.common.cancel}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => doCancel(false)}
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
      )}
    </div>
  );
}
