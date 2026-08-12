"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";

type ApiStatus = "pending" | "paid" | "failed";
type Status = "confirming" | "paid" | "failed" | "timeout";

// Same fast→calm polling profile as the wallet result screen: catch quick
// captures instantly, then keep confirming calmly for ~3 minutes. A definite
// failure stops immediately; an unsettled payment ends on a neutral "being
// confirmed" screen (never a false "rejected").
const FAST_MS = 800;
const FAST_TRIES = 20;
const SLOW_MS = 3000;
const MAX_TRIES = 68;
const nextDelay = (tries: number) => (tries < FAST_TRIES ? FAST_MS : SLOW_MS);

export function OrderPaymentResult({
  paymentId,
  orderId,
  orderNo,
  token,
}: {
  paymentId: string;
  orderId: string;
  orderNo: string;
  token: string;
}) {
  const { t, lang } = useLang();
  const [status, setStatus] = useState<Status>("confirming");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    let active = true;
    let tries = 0;
    async function poll() {
      if (!active) return;
      tries++;
      try {
        const res = await fetch(
          `/api/payment-status?payment=${encodeURIComponent(paymentId)}&t=${tries}`,
          { cache: "no-store" },
        );
        const j = (await res.json()) as { status: ApiStatus; amountFils: number };
        if (!active) return;
        if (typeof j.amountFils === "number") setAmount(j.amountFils);
        if (j.status === "paid" || j.status === "failed") {
          setStatus(j.status);
          return;
        }
      } catch {
        // keep trying
      }
      if (tries < MAX_TRIES) setTimeout(poll, nextDelay(tries));
      else if (active) setStatus("timeout");
    }
    poll();
    return () => {
      active = false;
    };
  }, [paymentId]);

  const isPaid = status === "paid";
  const isFailed = status === "failed";
  const isTimeout = status === "timeout";
  const receiptUrl = `/receipt/${orderId}?t=${encodeURIComponent(token)}&lang=${lang}`;
  const retryUrl = `/pay/order/${orderId}?t=${encodeURIComponent(token)}&failed=1`;

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
        <p className="mt-3 text-sm text-muted-foreground">
          {t.orderPay.order} <span className="font-bold tabular-nums">{orderNo}</span>
        </p>

        <div className="mt-5 flex justify-center">
          {isPaid ? (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
              <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5" /></svg>
            </span>
          ) : isFailed ? (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-danger/15 text-danger">
              <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </span>
          ) : isTimeout ? (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-brand">
              <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            </span>
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-brand">
              <svg className="h-11 w-11 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.2-8.6" strokeLinecap="round" /></svg>
            </span>
          )}
        </div>

        <h1 className="mt-5 text-xl font-extrabold">
          {isPaid
            ? t.orderPay.confirmedTitle
            : isFailed
              ? t.orderPay.rejectedTitle
              : t.orderPay.confirmingTitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isPaid
            ? `${t.orderPay.confirmedNote} ${amount ? formatMoney(amount, lang) : ""}`
            : isFailed
              ? t.orderPay.rejectedNote
              : isTimeout
                ? t.orderPay.pendingNote
                : t.orderPay.confirmingNote}
        </p>

        <div className="mt-7 space-y-2">
          {isPaid && (
            <a
              href={receiptUrl}
              className="block w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground"
            >
              {t.orderPay.viewReceipt}
            </a>
          )}
          {isFailed && (
            <a
              href={retryUrl}
              className="block w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground"
            >
              {t.orderPay.tryAgain}
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
