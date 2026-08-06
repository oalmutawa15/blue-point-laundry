"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney, kwdToFils } from "@/lib/money";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { adjustWallet } from "@/app/actions/admin";
import type { Tables } from "@/types/database";

export function CustomerDetail({
  customer,
  orders,
  transactions,
}: {
  customer: Pick<Tables<"profiles">, "id" | "full_name" | "phone" | "credit_fils">;
  orders: Tables<"orders">[];
  transactions: Tables<"credit_transactions">[];
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const locale = lang === "ar" ? "ar-KW" : "en-GB";

  async function apply() {
    const fils = kwdToFils(amount);
    if (!fils) return;
    setBusy(true);
    await adjustWallet(customer.id, fils, note);
    setBusy(false);
    setAmount("");
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="text-muted-foreground">
          <svg className="h-6 w-6 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold">{customer.full_name || "—"}</h1>
          <p dir="ltr" className="text-sm text-muted-foreground">{customer.phone}</p>
        </div>
        <span className={`ms-auto text-2xl font-extrabold tabular-nums ${customer.credit_fils < 0 ? "text-danger" : ""}`}>
          {formatMoney(customer.credit_fils, lang)}
        </span>
      </div>

      {/* Wallet adjust */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <p className="mb-2 font-bold">{t.admin.customers.adjust}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.-]/g, ""))}
            placeholder={t.admin.customers.adjustAmount}
            inputMode="decimal"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.admin.customers.adjustNote}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={apply}
            disabled={busy || !amount}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
          >
            {busy ? t.common.loading : t.admin.customers.apply}
          </button>
        </div>
      </div>

      {/* Orders */}
      <div>
        <h2 className="mb-2 font-bold">{t.admin.customers.orders}</h2>
        <div className="space-y-2">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/shop/orders/${o.id}`}
              className="flex items-center justify-between rounded-xl bg-card p-3 shadow-sm"
            >
              <span className="font-bold tabular-nums">{o.order_no}</span>
              <OrderStatusBadge status={o.status} />
              <span className="tabular-nums text-muted-foreground">
                {o.price_fils != null ? formatMoney(o.price_fils, lang) : "—"}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Wallet history */}
      <div>
        <h2 className="mb-2 font-bold">{t.credit.history}</h2>
        <div className="divide-y divide-border rounded-2xl bg-card px-4 shadow-sm">
          {transactions.map((tx) => {
            const positive = tx.amount_fils >= 0;
            return (
              <div key={tx.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-semibold">{t.credit.types[tx.type]}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                    {tx.note ? ` · ${tx.note}` : ""}
                  </p>
                </div>
                <span className={`font-bold tabular-nums ${positive ? "text-success" : "text-danger"}`}>
                  {positive ? "+" : ""}{formatMoney(tx.amount_fils, lang)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
