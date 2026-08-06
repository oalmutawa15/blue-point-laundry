"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { kwdToFils, formatMoney } from "@/lib/money";
import {
  assignPickupDriver,
  assignDeliveryDriver,
  saveIntake,
  startProcessing,
  type ItemInput,
} from "@/app/actions/shop";
import type { Tables } from "@/types/database";
import type { DriverLite } from "@/lib/orderTypes";

type ItemRow = { garment: string; service: string; qty: number; priceKwd: string };

const SERVICES = ["wash", "iron", "wash_iron", "dry_clean"] as const;

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
  const [rows, setRows] = useState<ItemRow[]>([
    { garment: "", service: "wash", qty: 1, priceKwd: "" },
  ]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [busy, setBusy] = useState(false);

  const total = rows.reduce(
    (s, r) => s + (r.qty || 0) * kwdToFils(r.priceKwd || "0"),
    0,
  );

  function update(i: number, patch: Partial<ItemRow>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
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
          <input
            value={r.garment}
            onChange={(e) => update(i, { garment: e.target.value })}
            placeholder={t.shop.garmentPlaceholder}
            className="mb-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={r.service}
              onChange={(e) => update(i, { service: e.target.value })}
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
        onClick={() =>
          setRows((rs) => [...rs, { garment: "", service: "wash", qty: 1, priceKwd: "" }])
        }
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

  async function refresh() {
    router.refresh();
  }

  switch (order.status) {
    case "requested":
      return (
        <DriverPicker
          drivers={drivers}
          label={t.shop.assignPickup}
          onAssign={async (id) => {
            await assignPickupDriver(order.id, id);
            await refresh();
          }}
        />
      );
    case "pickup_assigned":
      return (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          {t.status.pickup_assigned} — {t.driver.pickups}
        </p>
      );
    case "picked_up":
    case "at_shop":
      return <IntakeForm orderId={order.id} />;
    case "priced":
      return (
        <button
          onClick={async () => {
            await startProcessing(order.id);
            await refresh();
          }}
          className="w-full rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground"
        >
          {t.shop.startWashing}
        </button>
      );
    case "processing":
      return (
        <DriverPicker
          drivers={drivers}
          label={t.shop.markReady}
          onAssign={async (id) => {
            await assignDeliveryDriver(order.id, id);
            await refresh();
          }}
        />
      );
    case "out_for_delivery":
      return (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          {t.status.out_for_delivery}
        </p>
      );
    default:
      return null;
  }
}
