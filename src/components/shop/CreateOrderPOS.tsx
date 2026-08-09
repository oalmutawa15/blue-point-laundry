"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { filsToKwd, formatMoney } from "@/lib/money";
import {
  PRICE_CATEGORIES,
  allPriceItems,
  priceForItem,
  type FlatPriceItem,
  type PriceService,
} from "@/lib/priceList";
import { searchCustomers, createWalkInOrder, type CustomerHit } from "@/app/actions/walkin";
import type { ItemInput } from "@/app/actions/shop";

const SERVICES: PriceService[] = ["wash", "dryclean", "iron"];

type CartLine = {
  uid: number;
  item: FlatPriceItem;
  service: PriceService;
  qty: number;
  priceFils: number;
};

let uidSeq = 1;

export function CreateOrderPOS() {
  const { t, lang } = useLang();
  const router = useRouter();
  const name = (o: { en: string; ar: string }) => (lang === "ar" ? o.ar : o.en);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useState<CartLine[]>([]);

  // Customer
  const [custMode, setCustMode] = useState<"search" | "new">("search");
  const [custQuery, setCustQuery] = useState("");
  const [custResults, setCustResults] = useState<CustomerHit[]>([]);
  const [selectedCust, setSelectedCust] = useState<CustomerHit | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Item grid
  const items = allPriceItems().filter((it) => {
    if (cat !== "all" && it.categoryKey !== cat) return false;
    const s = q.trim().toLowerCase();
    return !s || it.en.toLowerCase().includes(s) || it.ar.includes(q.trim());
  });

  function addToCart(item: FlatPriceItem) {
    const service: PriceService = "wash";
    const priceFils = priceForItem(item, service) ?? 0;
    setCart((c) => [...c, { uid: uidSeq++, item, service, qty: 1, priceFils }]);
  }

  function updateLine(uid: number, patch: Partial<CartLine>) {
    setCart((c) =>
      c.map((l) => {
        if (l.uid !== uid) return l;
        const next = { ...l, ...patch };
        if (patch.service !== undefined) {
          next.priceFils = priceForItem(l.item, patch.service) ?? l.priceFils;
        }
        return next;
      }),
    );
  }

  const total = cart.reduce((s, l) => s + l.qty * l.priceFils, 0);

  async function onCustSearch(v: string) {
    setCustQuery(v);
    setSelectedCust(null);
    if (v.trim().length < 2) {
      setCustResults([]);
      return;
    }
    setCustResults(await searchCustomers(v));
  }

  async function submit() {
    setError(null);
    if (cart.length === 0) return setError(t.pos.noItems);
    const hasCustomer = selectedCust || (custMode === "new" && newName.trim() && newPhone.trim());
    if (!hasCustomer) return setError(t.pos.needCustomer);

    const orderItems: ItemInput[] = cart.map((l) => ({
      garment: name(l.item),
      service: l.service,
      qty: l.qty,
      unit_price_fils: l.priceFils,
    }));

    setBusy(true);
    const res = await createWalkInOrder({
      customerId: selectedCust?.id,
      newCustomer: selectedCust ? undefined : { name: newName.trim(), phone: newPhone.trim() },
      items: orderItems,
      deliveryDate: deliveryDate || null,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error === "invalid_phone" ? t.login.invalidPhone : res.error);
      return;
    }
    router.push(`/shop/orders/${res.id}`);
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Item catalog */}
      <div className="space-y-3">
        <h1 className="text-2xl font-extrabold">{t.pos.title}</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.pos.searchItems}
          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <div className="flex flex-wrap gap-2">
          {[{ key: "all", en: "All", ar: "الكل" }, ...PRICE_CATEGORIES].map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
                cat === c.key ? "bg-brand text-brand-foreground" : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {name(c)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it) => (
            <button
              key={`${it.categoryKey}-${it.key}`}
              type="button"
              onClick={() => addToCart(it)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-shadow hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l-1.5 4h-9L6 3Z" /><path d="M7.5 7 5 11v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9l-2.5-4" /></svg>
              </span>
              <span className="text-sm font-semibold leading-tight">{name(it)}</span>
              <span className="text-xs text-muted-foreground">
                {it.from != null ? filsToKwd(it.from) : filsToKwd(it.prices?.wash ?? 0)} {t.prices.kd}
              </span>
            </button>
          ))}
          {items.length === 0 && (
            <p className="col-span-full rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">
              {t.shop.noMatch}
            </p>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{t.pos.cart}</h2>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-sm font-semibold text-danger">
              {t.pos.reset}
            </button>
          )}
        </div>

        {/* Customer */}
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <div className="mb-2 flex gap-2">
            <button
              onClick={() => setCustMode("search")}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold ${custMode === "search" ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {t.pos.existingCustomer}
            </button>
            <button
              onClick={() => { setCustMode("new"); setSelectedCust(null); }}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold ${custMode === "new" ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {t.pos.newCustomer}
            </button>
          </div>

          {custMode === "search" ? (
            <div className="relative">
              <input
                value={selectedCust ? `${selectedCust.full_name || selectedCust.phone}` : custQuery}
                onChange={(e) => onCustSearch(e.target.value)}
                placeholder={t.pos.searchCustomers}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              />
              {!selectedCust && custResults.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-xl">
                  {custResults.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => { setSelectedCust(c); setCustResults([]); }}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm hover:bg-muted"
                      >
                        <span className="font-medium">{c.full_name || "—"}</span>
                        <span dir="ltr" className="text-xs text-muted-foreground">{c.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.pos.customerName}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder={t.pos.customerPhone}
                inputMode="numeric"
                dir="ltr"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          )}
        </div>

        {/* Items */}
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t.pos.emptyCart}</p>
          ) : (
            <div className="space-y-3">
              {cart.map((l) => (
                <div key={l.uid} className="rounded-xl border border-border p-2.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{name(l.item)}</span>
                    <button onClick={() => setCart((c) => c.filter((x) => x.uid !== l.uid))} className="text-xs font-semibold text-danger">
                      {t.common.delete}
                    </button>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                    <select
                      value={l.service}
                      onChange={(e) => updateLine(l.uid, { service: e.target.value as PriceService })}
                      className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs outline-none focus:border-brand"
                    >
                      {SERVICES.map((s) => (
                        <option key={s} value={s}>{t.shop.services[s]}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateLine(l.uid, { qty: Math.max(1, l.qty - 1) })} className="h-7 w-7 rounded-lg bg-muted text-sm font-bold">−</button>
                      <span className="w-6 text-center text-sm tabular-nums">{l.qty}</span>
                      <button onClick={() => updateLine(l.uid, { qty: l.qty + 1 })} className="h-7 w-7 rounded-lg bg-muted text-sm font-bold">+</button>
                    </div>
                    <span className="min-w-14 text-end text-sm font-bold tabular-nums">
                      {filsToKwd(l.qty * l.priceFils)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery date */}
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t.shop.deliveryDate}</label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
          <span className="font-bold">{t.shop.total}</span>
          <span className="text-lg font-extrabold tabular-nums">{formatMoney(total, lang)}</span>
        </div>

        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}

        <button
          onClick={submit}
          disabled={busy || cart.length === 0}
          className="w-full rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground disabled:opacity-50"
        >
          {busy ? t.common.saving : t.pos.createOrder}
        </button>
      </div>
    </div>
  );
}
