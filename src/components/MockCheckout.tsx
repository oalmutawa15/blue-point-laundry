"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";
import { confirmMockPayment } from "@/app/actions/payments";

export function MockCheckout({
  paymentId,
  amountFils,
  creditFils,
}: {
  paymentId: string;
  amountFils: number;
  creditFils: number;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState<null | "success" | "fail">(null);

  async function pay(outcome: "success" | "fail") {
    setBusy(outcome);
    await confirmMockPayment(paymentId, outcome);
    router.replace(`/credit?topup=${outcome === "success" ? "success" : "failed"}`);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-5">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="bg-slate-900 px-6 py-4 text-center text-white">
          <p className="text-lg font-extrabold">UPayments</p>
          <p className="text-xs text-white/60">
            {lang === "ar" ? "بوابة دفع تجريبية" : "Test payment gateway"}
          </p>
        </div>

        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">{t.credit.amount}</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums text-slate-900">
            {formatMoney(amountFils, lang)}
          </p>
          {creditFils > amountFils && (
            <p className="mt-2 inline-block rounded-full bg-success/10 px-3 py-1 text-sm font-bold text-success">
              {t.credit.get} {formatMoney(creditFils, lang)}
            </p>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={() => pay("success")}
              disabled={busy !== null}
              className="w-full rounded-xl bg-success px-4 py-3.5 text-base font-bold text-white transition-colors hover:brightness-95 disabled:opacity-50"
            >
              {busy === "success"
                ? t.credit.processing
                : lang === "ar"
                  ? "ادفع الآن"
                  : "Pay now"}
            </button>
            <button
              onClick={() => pay("fail")}
              disabled={busy !== null}
              className="w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {lang === "ar" ? "محاكاة فشل الدفع" : "Simulate failure"}
            </button>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            {lang === "ar"
              ? "وضع تجريبي — لن يتم خصم أي مبلغ حقيقي."
              : "Test mode — no real charge is made."}
          </p>
        </div>
      </div>
    </main>
  );
}
