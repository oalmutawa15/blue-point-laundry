"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";
import { createCustomer, type ShopCustomer } from "@/app/actions/customers";

export function ShopCustomers({ customers }: { customers: ShopCustomer[] }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const locale = lang === "ar" ? "ar-KW" : "en-GB";
  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "—";

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.full_name ?? "").toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")),
    );
  }, [customers, query]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t.customers.title}</h1>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
          {t.customers.addNew}
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.customers.searchPlaceholder}
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-brand"
      />

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3 font-bold">{t.customers.all}</div>
        {list.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{t.customers.noCustomers}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-start text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3 text-start">{t.customers.name}</th>
                  <th className="px-4 py-3 text-start">{t.customers.phone}</th>
                  <th className="px-4 py-3 text-center">{t.customers.ordersCount}</th>
                  <th className="px-4 py-3 text-start">{t.customers.lastOrder}</th>
                  <th className="px-4 py-3 text-end">{t.customers.pending}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/shop/customers/${c.id}`)}
                    className="cursor-pointer border-t border-border transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-semibold">{c.full_name || "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{c.phone.replace("+965", "")}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{c.orders_count}</td>
                    <td className="px-4 py-3">{fmtDate(c.last_order_at)}</td>
                    <td className="px-4 py-3 text-end tabular-nums">
                      {c.pending_fils > 0 ? (
                        <span className="font-bold text-danger">{formatMoney(c.pending_fils, lang)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adding && <AddCustomerModal onClose={() => setAdding(false)} onDone={() => { setAdding(false); router.refresh(); }} />}
    </div>
  );
}

function AddCustomerModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await createCustomer(name, phone);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-extrabold">{t.customers.addTitle}</h2>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.customers.fullName}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder={t.customers.phone}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-brand"
          />
          {error && <p className="text-sm font-semibold text-danger">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={busy || !phone.trim()}
              className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-brand-foreground disabled:opacity-50"
            >
              {busy ? t.customers.saving : t.customers.save}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-3 text-sm font-bold"
            >
              {t.customers.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
