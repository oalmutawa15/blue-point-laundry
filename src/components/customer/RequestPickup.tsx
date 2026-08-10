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
  const hasAddress = addresses.length > 0;
  const defaultId = addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? "";
  const [addressId, setAddressId] = useState(defaultId);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Always tappable: with an address it requests a pickup; without one it takes
  // the customer to add their location first.
  function onPress() {
    if (!hasAddress) {
      // First-time user: go add a location, then the pickup is placed
      // automatically (no need to come back and tap again).
      router.push("/addresses?request=1");
      return;
    }
    submit();
  }

  return (
    <div className="rounded-3xl bg-gradient-to-b from-brand to-brand-800 p-6 text-brand-foreground shadow-sm">
      <p className="text-center text-lg font-extrabold">{t.home.oneTap}</p>

      {/* Big one-tap button */}
      <div className="my-6 flex justify-center">
        <button
          type="button"
          onClick={onPress}
          disabled={submitting}
          aria-label={t.home.submitRequest}
          className="group relative flex h-40 w-40 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 transition active:scale-95 disabled:opacity-60"
        >
          <span className="absolute inset-4 rounded-full bg-white/10" />
          <span className="absolute inset-8 rounded-full bg-white shadow-lg" />
          <span className="relative text-brand">
            {submitting ? (
              <svg className="h-14 w-14 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.2-8.6" strokeLinecap="round" /></svg>
            ) : (
              <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a2 2 0 0 0-1 3.7V8L4.5 12.6A2 2 0 0 0 5.6 16h12.8a2 2 0 0 0 1.1-3.4L13 8V6.7A2 2 0 0 0 12 3Z" /><path d="M4 19h16" /></svg>
            )}
          </span>
        </button>
      </div>

      {!hasAddress && (
        <p className="text-center text-sm text-white/80">{t.home.needAddressFirst}</p>
      )}

      {/* Address selector */}
      {hasAddress && (
        <>
          <label className="mb-1.5 block text-xs font-semibold text-white/80">{t.home.pickFromAddress}</label>
          <select
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white px-3 py-3 text-sm text-foreground outline-none"
          >
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label ? `${a.label} — ` : ""}
                {formatAddress(a, lang)}
              </option>
            ))}
          </select>

          {showNote ? (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.home.notePlaceholder}
          rows={2}
          className="mt-3 w-full resize-none rounded-xl border border-white/20 bg-white px-3 py-3 text-sm text-foreground outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="mt-2 text-xs font-semibold text-white/80 underline"
        >
          + {t.home.noteOptional}
        </button>
      )}

      {error === "insufficient_credit" ? (
        <div className="mt-3 rounded-xl bg-white/95 px-3 py-3 text-sm">
          <p className="font-semibold text-danger">{t.home.insufficientCredit}</p>
          <Link
            href="/credit"
            className="mt-2 inline-block rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground"
          >
            {t.home.topUpNow}
          </Link>
        </div>
      ) : (
        error && <p className="mt-3 rounded-lg bg-white/95 px-3 py-2 text-sm text-danger">{error}</p>
      )}
        </>
      )}
    </div>
  );
}
