"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { filsToKwd } from "@/lib/money";
import type { Tables } from "@/types/database";

export function RefundReceipt({
  order,
  customerName,
  customerPhone,
  items,
  method,
}: {
  order: Tables<"orders">;
  customerName: string | null;
  customerPhone: string | null;
  items: Tables<"order_items">[];
  method: "wallet" | "cash" | "none";
}) {
  const { t } = useLang();
  const refund = order.refund_fils ?? 0;
  const when = (order.updated_at ?? order.created_at)?.slice(0, 16).replace("T", " ");

  return (
    <div>
      {/* Controls — hidden when printing */}
      <div className="mb-4 flex items-center gap-2 print:hidden">
        <Link href="/shop" className="text-sm font-semibold text-muted-foreground">
          ← {t.shop.title}
        </Link>
        <button
          onClick={() => window.print()}
          className="ms-auto rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground"
        >
          {t.receipt.print}
        </button>
      </div>

      {/* Receipt */}
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-6 text-black shadow-sm print:border-0 print:shadow-none">
        <div className="mb-4 flex flex-col items-center border-b border-dashed border-gray-300 pb-4 text-center">
          <Image src="/blue-point-logo.png" alt={t.brandFull} width={64} height={64} className="h-16 w-16 object-contain" />
          <p className="mt-2 text-lg font-extrabold text-brand">{t.brand}</p>
          <p className="mt-1 text-sm font-bold">{t.receipt.refundTitle}</p>
        </div>

        <div className="space-y-1.5 text-sm">
          <Row label={t.orders.orderNo} value={order.order_no} />
          <Row label={t.receipt.date} value={when ?? "—"} />
          <Row label={t.driver.customer} value={customerName || customerPhone || "—"} />
          {customerPhone && <Row label={t.pos.customerPhone} value={customerPhone} ltr />}
        </div>

        {items.length > 0 && (
          <div className="mt-4 border-t border-dashed border-gray-300 pt-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between py-0.5 text-sm">
                <span>{it.garment || "—"} ×{it.qty}</span>
                <span className="tabular-nums">{filsToKwd(it.qty * it.unit_price_fils)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-1.5 border-t border-dashed border-gray-300 pt-3 text-sm">
          <Row label={t.receipt.method} value={method === "wallet" ? t.receipt.wallet : method === "cash" ? t.receipt.cash : "—"} />
          {order.cancel_reason && <Row label={t.receipt.reason} value={order.cancel_reason} />}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-100 px-4 py-3">
          <span className="font-extrabold">{t.receipt.refundAmount}</span>
          <span className="text-lg font-extrabold tabular-nums text-brand">{filsToKwd(refund)} {t.prices.kd}</span>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">{t.receipt.thanks}</p>
      </div>
    </div>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span dir={ltr ? "ltr" : undefined} className="font-semibold">{value}</span>
    </div>
  );
}
