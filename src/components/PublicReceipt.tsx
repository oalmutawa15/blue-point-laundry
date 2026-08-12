"use client";

import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { PREF_GROUPS, prefLabel, biGroup, type Preferences } from "@/lib/preferences";
import type { OrderStatus } from "@/types/database";

export type ReceiptItem = {
  service: string;
  garment: string | null;
  qty: number;
  unit_price_fils: number;
};

export type ReceiptData = {
  orderNo: string;
  status: OrderStatus;
  createdAt: string;
  customerName: string;
  pieceCount: number | null;
  priceFils: number | null;
  items: ReceiptItem[];
  preferences?: Preferences;
  paymentMethod?: string | null;
};

// Bilingual label for a walk-in payment method.
const PAYMENT_LABELS: Record<string, { ar: string; en: string }> = {
  cash: { ar: "نقداً", en: "Cash" },
  knet: { ar: "كي نت", en: "KNET" },
  credit_card: { ar: "بطاقة ائتمان", en: "Credit card" },
  wallet: { ar: "رصيد الموقع", en: "Website credit" },
  link: { ar: "رابط دفع", en: "Payment link" },
};

export function PublicReceipt({ data }: { data: ReceiptData }) {
  const { t, lang } = useLang();
  const date = new Date(data.createdAt).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-GB");
  const total = data.priceFils ?? data.items.reduce((s, i) => s + i.qty * i.unit_price_fils, 0);

  const prefs = data.preferences ?? {};
  const prefRows = PREF_GROUPS.map((g) => ({ label: biGroup(g), value: prefLabel(g.key, prefs[g.key]) })).filter(
    (r) => r.value,
  );
  const hasPrefs = prefRows.length > 0 || !!prefs.notes?.trim();

  return (
    <main className="min-h-screen bg-background px-4 py-8 print:bg-white">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-card p-6 shadow-lg print:shadow-none">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/blue-point-logo.png"
            alt={t.brandFull}
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
          />
          <h1 className="mt-3 text-xl font-extrabold">{t.brand}</h1>
          <p className="text-sm text-muted-foreground">{t.publicReceipt.title}</p>
        </div>

        <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <Row label={t.publicReceipt.order} value={<span className="font-extrabold tabular-nums">{data.orderNo}</span>} />
          <Row label={t.publicReceipt.date} value={date} />
          <Row label={t.publicReceipt.customer} value={data.customerName || "—"} />
          <Row label={t.publicReceipt.status} value={<OrderStatusBadge status={data.status} />} />
        </div>

        {data.items.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-3 text-xs font-bold text-muted-foreground">
              <span>{t.publicReceipt.item}</span>
              <span className="text-center">{t.publicReceipt.qty}</span>
              <span className="text-end">{t.publicReceipt.price}</span>
            </div>
            <div className="space-y-1.5 text-sm">
              {data.items.map((i, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                  <span className="font-semibold">
                    {i.garment ? `${i.garment} — ${i.service}` : i.service}
                  </span>
                  <span className="text-center tabular-nums">{i.qty}</span>
                  <span className="text-end tabular-nums">
                    {formatMoney(i.qty * i.unit_price_fils, lang)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasPrefs && (
          <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
            <p className="mb-1 font-bold text-brand">{t.preferences.title}</p>
            {prefRows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
            {prefs.notes?.trim() && (
              <p className="mt-1 rounded-lg bg-muted px-3 py-2">{prefs.notes}</p>
            )}
          </div>
        )}

        <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          {data.pieceCount != null && (
            <Row label={t.publicReceipt.pieces} value={<span className="tabular-nums">{data.pieceCount}</span>} />
          )}
          {data.paymentMethod && PAYMENT_LABELS[data.paymentMethod] && (
            <Row
              label={lang === "ar" ? "طريقة الدفع" : "Payment method"}
              value={PAYMENT_LABELS[data.paymentMethod][lang]}
            />
          )}
          <div className="flex items-center justify-between text-lg font-extrabold">
            <span>{t.publicReceipt.total}</span>
            <span className="tabular-nums">{formatMoney(total, lang)}</span>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">{t.publicReceipt.thanks}</p>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground print:hidden"
        >
          {t.publicReceipt.print}
        </button>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
