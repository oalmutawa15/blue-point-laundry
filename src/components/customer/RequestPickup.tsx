"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatAddress } from "@/lib/address";
import { createPickupRequest } from "@/app/actions/orders";
import type { Tables } from "@/types/database";

export function RequestPickup({ addresses }: { addresses: Tables<"addresses">[] }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const defaultId =
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? "";
  const [addressId, setAddressId] = useState(defaultId);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (addresses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">{t.home.needAddressFirst}</p>
        <Link
          href="/addresses"
          className="mt-3 inline-block rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground"
        >
          {t.addresses.add}
        </Link>
      </div>
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await createPickupRequest(addressId, note);
    if (!res.ok) {
      setSubmitting(false);
      setError(res.error);
      return;
    }
    router.push(`/orders/${res.id}`);
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <label className="mb-1.5 block text-sm font-semibold">{t.home.pickFromAddress}</label>
      <select
        value={addressId}
        onChange={(e) => setAddressId(e.target.value)}
        className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm outline-none focus:border-brand"
      >
        {addresses.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label ? `${a.label} — ` : ""}
            {formatAddress(a, lang)}
          </option>
        ))}
      </select>

      <label className="mb-1.5 mt-4 block text-sm font-semibold">{t.home.noteOptional}</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.home.notePlaceholder}
        rows={2}
        className="w-full resize-none rounded-xl border border-border bg-white px-3 py-3 text-sm outline-none focus:border-brand"
      />

      {error === "insufficient_credit" ? (
        <div className="mt-3 rounded-xl bg-danger/10 px-3 py-3 text-sm">
          <p className="font-semibold text-danger">{t.home.insufficientCredit}</p>
          <Link
            href="/credit"
            className="mt-2 inline-block rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground"
          >
            {t.home.topUpNow}
          </Link>
        </div>
      ) : (
        error && <p className="mt-3 text-sm text-danger">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting || !addressId}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        {submitting ? t.common.loading : t.home.submitRequest}
      </button>
    </div>
  );
}
