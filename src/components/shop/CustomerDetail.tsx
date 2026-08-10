"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";
import { formatAddress } from "@/lib/address";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { useRealtimeOrders } from "@/lib/useRealtimeOrders";
import { addCustomerCredit } from "@/app/actions/customers";
import type { Tables } from "@/types/database";

type CustomerRow = Pick<Tables<"profiles">, "id" | "full_name" | "phone" | "credit_fils" | "created_at">;
type OrderRow = Pick<Tables<"orders">, "id" | "order_no" | "status" | "price_fils" | "delivery_date" | "created_at">;
type TxnRow = Pick<Tables<"credit_transactions">, "id" | "type" | "amount_fils" | "note" | "created_at">;

type Tab = "info" | "orders" | "transactions";

export function CustomerDetail({
  customer,
  orders,
  transactions,
  address,
}: {
  customer: CustomerRow;
  orders: OrderRow[];
  transactions: TxnRow[];
  address: Tables<"addresses"> | null;
}) {
  const { t, lang } = useLang();
  useRealtimeOrders("customer-detail");
  const [tab, setTab] = useState<Tab>("info");

  const locale = lang === "ar" ? "ar-KW" : "en-GB";
  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "—";

  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const outstanding = orders
    .filter((o) => o.status === "awaiting_payment")
    .reduce((s, o) => s + (o.price_fils ?? 0), 0);
  const nonCancelled = orders.filter((o) => o.status !== "cancelled");
  const lastOrderAt = nonCancelled[0]?.created_at ?? null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: t.customers.info },
    { key: "orders", label: t.customers.ordersTab },
    { key: "transactions", label: t.customers.transactions },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h1 className="text-xl font-extrabold">{customer.full_name || "—"}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground tabular-nums" dir="ltr">
          {customer.phone}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-card p-1 shadow-sm">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
              tab === tb.key ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <InfoTab
          customer={customer}
          address={address}
          outstanding={outstanding}
          totalOrders={nonCancelled.length}
          lastOrderAt={lastOrderAt}
          fmtDate={fmtDate}
        />
      )}
      {tab === "orders" && <OrdersTab orders={orders} activeOrders={activeOrders} fmtDate={fmtDate} />}
      {tab === "transactions" && <TransactionsTab transactions={transactions} fmtDate={fmtDate} />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

function InfoTab({
  customer,
  address,
  outstanding,
  totalOrders,
  lastOrderAt,
  fmtDate,
}: {
  customer: CustomerRow;
  address: Tables<"addresses"> | null;
  outstanding: number;
  totalOrders: number;
  lastOrderAt: string | null;
  fmtDate: (s: string | null) => string;
}) {
  const { t, lang } = useLang();

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div>
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">{t.customers.statsTitle}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label={t.customers.outstanding}
            value={<span className={outstanding > 0 ? "text-danger" : ""}>{formatMoney(outstanding, lang)}</span>}
          />
          <StatCard label={t.customers.totalOrders} value={totalOrders} />
          <StatCard label={t.customers.lastOrder} value={fmtDate(lastOrderAt)} />
        </div>
      </div>

      {/* Wallet */}
      <div>
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">{t.customers.walletTitle}</h2>
        <WalletCard customer={customer} />
      </div>

      {/* Basic info */}
      <div>
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">{t.customers.basicInfo}</h2>
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
            <span className="font-semibold">{customer.full_name || "—"}</span>
          </div>
          <div className="flex items-center gap-2" dir="ltr">
            <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></svg>
            <span className="font-semibold tabular-nums">{customer.phone}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">{t.customers.addressTitle}</h2>
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          {address ? (
            <span className="font-semibold">{formatAddress(address, lang)}</span>
          ) : (
            <span className="text-muted-foreground">{t.customers.noAddress}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function WalletCard({ customer }: { customer: CustomerRow }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await addCustomerCredit(customer.id, parseFloat(amount || "0"));
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setAdding(false);
    setAmount("");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{t.customers.walletBalance}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{formatMoney(customer.credit_fils, lang)}</p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-bold text-brand-foreground"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          {t.customers.addCredit}
        </button>
      </div>
      {adding && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder={t.customers.amountKwd}
            className="w-32 rounded-lg border border-border bg-white px-3 py-2 text-sm tabular-nums outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={save}
            disabled={busy || !amount}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-brand-foreground disabled:opacity-50"
          >
            {busy ? t.customers.saving : t.customers.save}
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setAmount(""); setError(null); }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-bold"
          >
            {t.customers.cancel}
          </button>
          {error && <p className="w-full text-sm font-semibold text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}

function OrdersTab({
  orders,
  activeOrders,
  fmtDate,
}: {
  orders: OrderRow[];
  activeOrders: OrderRow[];
  fmtDate: (s: string | null) => string;
}) {
  const { t, lang } = useLang();
  const [view, setView] = useState<"active" | "history">("active");
  const historyOrders = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));
  const list = view === "active" ? activeOrders : historyOrders;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["active", "history"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              view === v ? "bg-brand-soft text-brand" : "bg-card text-muted-foreground"
            }`}
          >
            {v === "active" ? t.customers.active : t.customers.history}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {list.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{t.customers.noOrders}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3 text-start">{t.customers.order}</th>
                  <th className="px-4 py-3 text-start">{t.shop.deliveryDate}</th>
                  <th className="px-4 py-3 text-start">{t.customers.status}</th>
                  <th className="px-4 py-3 text-end">{t.customers.payment}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link href={`/shop/orders/${o.id}`} className="font-extrabold tabular-nums text-brand">
                        {o.order_no}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{fmtDate(o.delivery_date)}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-end font-bold tabular-nums">
                      {o.price_fils != null ? formatMoney(o.price_fils, lang) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionsTab({
  transactions,
  fmtDate,
}: {
  transactions: TxnRow[];
  fmtDate: (s: string | null) => string;
}) {
  const { t, lang } = useLang();
  const [type, setType] = useState<"all" | TxnRow["type"]>("all");

  const label: Record<string, string> = {
    topup: t.customers.txnTopup,
    order_charge: t.customers.txnOrderCharge,
    refund: t.customers.txnRefund,
    adjustment: t.customers.txnAdjustment,
  };

  const list = useMemo(
    () => (type === "all" ? transactions : transactions.filter((x) => x.type === type)),
    [transactions, type],
  );

  const TYPES: ("all" | TxnRow["type"])[] = ["all", "topup", "order_charge", "refund", "adjustment"];

  return (
    <div className="space-y-3">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as typeof type)}
        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand sm:w-64"
      >
        {TYPES.map((tp) => (
          <option key={tp} value={tp}>
            {tp === "all" ? t.customers.allTypes : label[tp]}
          </option>
        ))}
      </select>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {list.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{t.customers.noTransactions}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3 text-start">{t.customers.transaction}</th>
                  <th className="px-4 py-3 text-start">{t.customers.date}</th>
                  <th className="px-4 py-3 text-end">{t.customers.amount}</th>
                  <th className="px-4 py-3 text-start">{t.customers.method}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((x) => {
                  const positive = x.amount_fils >= 0;
                  return (
                    <tr key={x.id} className="border-t border-border">
                      <td className="px-4 py-3 font-semibold">{label[x.type] ?? x.type}</td>
                      <td className="px-4 py-3">{fmtDate(x.created_at)}</td>
                      <td className={`px-4 py-3 text-end font-bold tabular-nums ${positive ? "text-success" : "text-danger"}`}>
                        {positive ? "+" : "−"}
                        {formatMoney(Math.abs(x.amount_fils), lang)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{x.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
