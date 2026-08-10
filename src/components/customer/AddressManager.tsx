"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatAddress } from "@/lib/address";
import { AddressForm } from "./AddressForm";
import { deleteAddress, setDefaultAddress } from "@/app/actions/addresses";
import { createPickupRequest } from "@/app/actions/orders";
import type { Tables } from "@/types/database";

export function AddressManager({ addresses }: { addresses: Tables<"addresses">[] }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Came here from the home pickup button → open the form and, once an address
  // is added, place the pickup request straight away.
  const wantsPickup = searchParams.get("request") === "1";
  const [open, setOpen] = useState(wantsPickup && addresses.length === 0);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  async function handleAdded(addressId: string) {
    setOpen(false);
    if (!wantsPickup) {
      router.refresh();
      return;
    }
    // Place the pickup request with the just-added address.
    setPlacing(true);
    setPlaceError(null);
    const res = await createPickupRequest(addressId, "");
    setPlacing(false);
    if (res.ok) {
      router.push(`/orders/${res.id}`);
      router.refresh();
      return;
    }
    setPlaceError(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t.addresses.title}</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-brand-foreground"
        >
          + {t.addresses.add}
        </button>
      </div>

      {placing && (
        <p className="rounded-2xl bg-brand-soft px-4 py-3 text-center text-sm font-semibold text-brand">
          {t.common.loading}
        </p>
      )}
      {placeError === "insufficient_credit" ? (
        <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm">
          <p className="font-semibold text-danger">{t.home.insufficientCredit}</p>
          <Link
            href="/credit"
            className="mt-2 inline-block rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground"
          >
            {t.home.topUpNow}
          </Link>
        </div>
      ) : placeError ? (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{placeError}</p>
      ) : null}

      {addresses.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
          {t.addresses.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold">{a.label || t.addresses.area}</span>
                {a.is_default && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
                    {t.addresses.default}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{formatAddress(a, lang)}</p>
              <div className="mt-3 flex gap-3 text-sm">
                {!a.is_default && (
                  <button
                    onClick={async () => {
                      await setDefaultAddress(a.id);
                      router.refresh();
                    }}
                    className="font-semibold text-brand"
                  >
                    {t.addresses.setDefault}
                  </button>
                )}
                <button
                  onClick={async () => {
                    await deleteAddress(a.id);
                    router.refresh();
                  }}
                  className="font-semibold text-danger"
                >
                  {t.common.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-5 sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{t.addresses.add}</h2>
              <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground">
                {t.common.close}
              </button>
            </div>
            <AddressForm onDone={handleAdded} />
          </div>
        </div>
      )}
    </div>
  );
}
