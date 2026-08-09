"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";

type ApiStatus = "pending" | "paid" | "failed";
// "confirming" = still polling; "timeout" = we stopped polling without a final answer.
type Status = "confirming" | "paid" | "failed" | "timeout";

// Capture routinely lags the browser redirect by 30–60s in this gateway, so we
// poll for up to ~2 minutes before giving up. Each poll re-verifies with
// UPayments, so a late capture still flips us to "approved" the moment it lands.
const MAX_TRIES = 45;
const INTERVAL_MS = 2500;

export function PaymentResult({ paymentId }: { paymentId: string }) {
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
        const res = await fetch(`/api/payment-status?payment=${encodeURIComponent(paymentId)}`, {
          cache: "no-store",
        });
        const j = (await res.json()) as { status: ApiStatus; amountFils: number };
        if (!active) return;
        if (typeof j.amountFils === "number") setAmount(j.amountFils);
        if (j.status === "paid" || j.status === "failed") {
          setStatus(j.status);
          return; // final answer — stop polling
        }
      } catch {
        // network hiccup — keep trying
      }
      if (tries < MAX_TRIES) {
        setTimeout(poll, INTERVAL_MS);
      } else if (active) {
        // Stopped without a definite answer — show a clear "still processing"
        // screen instead of an eternal spinner.
        setStatus("timeout");
      }
    }
    poll();
    return () => {
      active = false;
    };
  }, [paymentId]);

  const isPaid = status === "paid";
  const isFailed = status === "failed";
  const isTimeout = status === "timeout";

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

        {/* Icon */}
        <div className="mt-6 flex justify-center">
          {isPaid ? (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
              <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5" /></svg>
            </span>
          ) : isFailed ? (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-danger/15 text-danger">
              <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </span>
          ) : isTimeout ? (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/15 text-warning">
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
            ? t.payResult.approved
            : isFailed
              ? t.payResult.failed
              : isTimeout
                ? t.payResult.pending
                : t.payResult.confirming}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isPaid
            ? t.payResult.addedToWallet.replace("{amount}", formatMoney(amount, lang))
            : isFailed
              ? t.payResult.failedNote
              : isTimeout
                ? t.payResult.pendingNote
                : t.payResult.confirmingNote}
        </p>

        <div className="mt-7 space-y-2">
          <Link
            href="/credit"
            className="block w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground"
          >
            {t.payResult.backToWallet}
          </Link>
          {isFailed && (
            <Link
              href="/home"
              className="block w-full rounded-xl border border-border px-4 py-3 text-base font-bold text-brand"
            >
              {t.nav.home}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
