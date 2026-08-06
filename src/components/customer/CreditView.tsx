"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";
import { createTopUp } from "@/app/actions/payments";
import { CREDIT_PACKAGES } from "@/lib/packages";
import type { Tables } from "@/types/database";

export function CreditView({
  balanceFils,
  transactions,
  topupStatus,
}: {
  balanceFils: number;
  transactions: Tables<"credit_transactions">[];
  topupStatus: "success" | "failed" | null;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const locale = lang === "ar" ? "ar-KW" : "en-GB";
  const [selected, setSelected] = useState<number>(CREDIT_PACKAGES[0].deposit);
  const [busy, setBusy] = useState(false);

  async function topUp() {
    setBusy(true);
    const res = await createTopUp(selected);
    if (!res.ok) {
      setBusy(false);
      return;
    }
    router.push(res.url);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{t.credit.title}</h1>

      {topupStatus && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            topupStatus === "success"
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger"
          }`}
        >
          {topupStatus === "success" ? t.credit.topUpSuccess : t.credit.topUpFailed}
        </div>
      )}

      {/* Balance */}
      <div className="rounded-2xl bg-brand p-6 text-brand-foreground shadow-sm">
        <p className="text-sm text-white/70">{t.credit.balance}</p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums">
          {formatMoney(balanceFils, lang)}
        </p>
      </div>

      {/* Packages */}
      <div>
        <h2 className="mb-3 font-bold">{t.credit.packages}</h2>
        <div className="grid grid-cols-2 gap-3">
          {CREDIT_PACKAGES.map((p) => {
            const active = selected === p.deposit;
            return (
              <button
                key={p.deposit}
                onClick={() => setSelected(p.deposit)}
                className={`relative rounded-2xl border p-4 text-start transition-colors ${
                  active
                    ? "border-brand bg-brand-soft"
                    : "border-border bg-card hover:border-brand/40"
                }`}
              >
                <span className="absolute top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-brand-foreground ltr:right-2 rtl:left-2">
                  {t.credit.save} {p.save}%
                </span>
                <p className="text-xs text-muted-foreground">{t.credit.get}</p>
                <p className="text-2xl font-extrabold tabular-nums text-brand">
                  {formatMoney(p.credit, lang)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.credit.deposit} {formatMoney(p.deposit, lang)}
                </p>
              </button>
            );
          })}
        </div>

        <button
          onClick={topUp}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? t.common.loading : t.credit.payWith}
        </button>
      </div>

      {/* History */}
      <div>
        <h2 className="mb-2 font-bold">{t.credit.history}</h2>
        {transactions.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
            {t.credit.empty}
          </p>
        ) : (
          <div className="divide-y divide-border rounded-2xl bg-card px-4 shadow-sm">
            {transactions.map((tx) => {
              const positive = tx.amount_fils >= 0;
              return (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold">{t.credit.types[tx.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      positive ? "text-success" : "text-danger"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {formatMoney(tx.amount_fils, lang)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
