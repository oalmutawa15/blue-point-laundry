"use client";

import { useState } from "react";
import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";
import { startOrderPayment } from "@/app/actions/orderPay";

// Public order-payment page. The amount is passed in from the server (read from
// the order's own price_fils) and only shown here — the "Pay now" action re-reads
// the price server-side, so nothing on this page can change what is charged.
export function OrderPayView({
  orderId,
  orderNo,
  amountFils,
  token,
  paid,
  failed,
}: {
  orderId: string;
  orderNo: string;
  amountFils: number;
  token: string;
  paid: boolean;
  failed: boolean;
}) {
  const { t, lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    const res = await startOrderPayment(orderId, token);
    if (!res.ok) {
      setBusy(false);
      setError(t.orderPay.notFound);
      return;
    }
    if ("alreadyPaid" in res) {
      // Someone paid it in the meantime — reload to show the paid state.
      window.location.reload();
      return;
    }
    window.location.href = res.url;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-xl">
        <Image
          src="/blue-point-logo.png"
          alt={t.brandFull}
          width={56}
          height={56}
          className="mx-auto h-14 w-14 object-contain"
        />
        <h1 className="mt-4 text-lg font-extrabold">{t.orderPay.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.orderPay.order} <span className="font-bold tabular-nums">{orderNo}</span>
        </p>

        {paid ? (
          <div className="mt-6">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
              <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5" /></svg>
            </span>
            <p className="mt-4 text-base font-extrabold">{t.orderPay.alreadyPaid}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.orderPay.alreadyPaidNote}</p>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl bg-brand-soft px-4 py-5">
              <p className="text-xs font-semibold text-muted-foreground">{t.orderPay.amount}</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-brand">
                {formatMoney(amountFils, lang)}
              </p>
            </div>

            {failed && (
              <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
                {t.orderPay.failedRetry}
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={pay}
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground shadow-lg disabled:opacity-50"
            >
              {busy ? t.orderPay.starting : `${t.orderPay.payNow} · ${formatMoney(amountFils, lang)}`}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              {t.orderPay.secure}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
