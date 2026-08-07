"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatAddress } from "@/lib/address";
import { AddressForm } from "./AddressForm";
import { deleteAddress, setDefaultAddress } from "@/app/actions/addresses";
import type { Tables } from "@/types/database";

export function AddressManager({ addresses }: { addresses: Tables<"addresses">[] }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
            <AddressForm
              onDone={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
