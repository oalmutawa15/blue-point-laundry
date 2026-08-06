"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatAddress } from "@/lib/address";
import {
  addAddress,
  deleteAddress,
  requestAddressOtp,
  setDefaultAddress,
  type AddressInput,
} from "@/app/actions/addresses";
import type { Tables } from "@/types/database";

const emptyForm: AddressInput = {
  label: "",
  area: "",
  block: "",
  street: "",
  building: "",
  floor: "",
  apartment: "",
  extra_directions: "",
  contact_phone: "",
};

export function AddressManager({ addresses }: { addresses: Tables<"addresses">[] }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [otpStage, setOtpStage] = useState(false);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AddressInput>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function reset() {
    setForm(emptyForm);
    setOtpStage(false);
    setCode("");
    setDevCode(null);
    setError(null);
    setBusy(false);
  }

  async function sendCode() {
    setError(null);
    if (!form.area.trim()) {
      setError(t.common.required + ": " + t.addresses.area);
      return;
    }
    setBusy(true);
    const res = await requestAddressOtp();
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setOtpStage(true);
    setDevCode(res.devCode ?? null);
  }

  async function save() {
    setError(null);
    setBusy(true);
    const res = await addAddress(form, code);
    setBusy(false);
    if (!res.ok) {
      setError(res.error === "otp_invalid" ? t.addresses.otpInvalid : res.error);
      return;
    }
    setOpen(false);
    reset();
    router.refresh();
  }

  const field = (
    key: keyof AddressInput,
    label: string,
    opts?: { required?: boolean },
  ) => (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label} {opts?.required && <span className="text-danger">*</span>}
      </label>
      <input
        value={form[key] ?? ""}
        onChange={(e) => set(key, e.target.value)}
        className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t.addresses.title}</h1>
        <button
          onClick={() => {
            reset();
            setOpen(true);
          }}
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
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{a.label || t.addresses.area}</span>
                    {a.is_default && (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
                        {t.addresses.default}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatAddress(a, lang)}
                  </p>
                </div>
              </div>
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

      {/* Add modal */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-5 sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{t.addresses.add}</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground"
              >
                {t.common.close}
              </button>
            </div>

            {!otpStage ? (
              <div className="space-y-3">
                {field("label", t.addresses.label)}
                <div className="grid grid-cols-2 gap-3">
                  {field("area", t.addresses.area, { required: true })}
                  {field("block", t.addresses.block)}
                  {field("street", t.addresses.street)}
                  {field("building", t.addresses.building)}
                  {field("floor", t.addresses.floor)}
                  {field("apartment", t.addresses.apartment)}
                </div>
                {field("contact_phone", t.addresses.contactPhone)}
                {field("extra_directions", t.addresses.directions)}

                {error && <p className="text-sm text-danger">{error}</p>}

                <button
                  onClick={sendCode}
                  disabled={busy}
                  className="w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground disabled:opacity-50"
                >
                  {busy ? t.common.loading : t.addresses.sendCode}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t.addresses.otpDesc}</p>
                {devCode && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {t.addresses.devHint}: <span className="font-bold tabular-nums">{devCode}</span>
                  </p>
                )}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    {t.addresses.otpCode}
                  </label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    dir="ltr"
                    className="w-full rounded-lg border border-border bg-white px-3 py-3 text-center text-lg font-bold tracking-widest tabular-nums outline-none focus:border-brand"
                  />
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}

                <button
                  onClick={save}
                  disabled={busy || code.length < 4}
                  className="w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground disabled:opacity-50"
                >
                  {busy ? t.common.saving : t.addresses.save}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
