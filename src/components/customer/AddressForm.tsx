"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  KUWAIT_AREAS,
  findAreaByEn,
  nearestArea,
  numberRange,
  toArabicDigits,
} from "@/lib/kuwait";
import { requestAddressOtp, addAddress } from "@/app/actions/addresses";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

type Opt = { value: string; label: string };

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-white px-2 py-2.5 text-sm outline-none focus:border-brand"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function AddressForm({ onDone }: { onDone: () => void }) {
  const { t, lang } = useLang();
  const [label, setLabel] = useState("");
  const [areaEn, setAreaEn] = useState("");
  const [block, setBlock] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [directions, setDirections] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; key: number } | null>(null);

  const [otpStage, setOtpStage] = useState(false);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = (n: number) => (lang === "ar" ? toArabicDigits(n) : String(n));
  const numOpts = (from: number, to: number): Opt[] =>
    numberRange(from, to).map((n) => ({ value: String(n), label: num(n) }));

  const areaOptions: Opt[] = useMemo(() => {
    const arr = [...KUWAIT_AREAS];
    arr.sort((a, b) => (lang === "ar" ? a.ar.localeCompare(b.ar) : a.en.localeCompare(b.en)));
    return arr.map((a) => ({ value: a.en, label: lang === "ar" ? a.ar : a.en }));
  }, [lang]);

  const floorOptions: Opt[] = [
    { value: "0", label: t.addresses.ground },
    ...numOpts(1, 30),
  ];

  function selectArea(en: string) {
    setAreaEn(en);
    const a = findAreaByEn(en);
    if (a) {
      setPin({ lat: a.lat, lng: a.lng });
      setFlyTo({ lat: a.lat, lng: a.lng, key: Date.now() });
    }
  }

  function onPick(lat: number, lng: number) {
    setPin({ lat, lng });
    setAreaEn(nearestArea(lat, lng).en); // reverse-fill the area from the pin
  }

  async function sendCode() {
    setError(null);
    if (!areaEn) {
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
    const res = await addAddress(
      {
        label: label || undefined,
        area: areaEn,
        block: block || undefined,
        street: street || undefined,
        building: building || undefined,
        floor: floor || undefined,
        apartment: apartment || undefined,
        extra_directions: directions || undefined,
        lat: pin?.lat,
        lng: pin?.lng,
      },
      code,
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error === "otp_invalid" ? t.addresses.otpInvalid : res.error);
      return;
    }
    onDone();
  }

  if (otpStage) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{t.addresses.otpDesc}</p>
        {devCode && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t.addresses.devHint}: <span className="font-bold tabular-nums">{devCode}</span>
          </p>
        )}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          dir="ltr"
          className="w-full rounded-lg border border-border bg-white px-3 py-3 text-center text-lg font-bold tracking-widest tabular-nums outline-none focus:border-brand"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          onClick={save}
          disabled={busy || code.length < 4}
          className="w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground disabled:opacity-50"
        >
          {busy ? t.common.saving : t.addresses.save}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t.addresses.label}
        className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
      />

      <Select
        label={t.addresses.area}
        value={areaEn}
        onChange={selectArea}
        options={areaOptions}
        placeholder={t.addresses.selectArea}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select label={t.addresses.block} value={block} onChange={setBlock} options={numOpts(1, 40)} placeholder={t.addresses.choose} />
        <Select label={t.addresses.street} value={street} onChange={setStreet} options={numOpts(1, 120)} placeholder={t.addresses.choose} />
        <Select label={t.addresses.building} value={building} onChange={setBuilding} options={numOpts(1, 99)} placeholder={t.addresses.choose} />
        <Select label={t.addresses.floor} value={floor} onChange={setFloor} options={floorOptions} placeholder={t.addresses.choose} />
        <Select label={t.addresses.apartment} value={apartment} onChange={setApartment} options={numOpts(1, 60)} placeholder={t.addresses.choose} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">
          {t.addresses.mapTitle}
        </label>
        <LocationMap initial={pin} flyTo={flyTo} onPick={onPick} />
        <p className="mt-1 text-xs text-muted-foreground">{t.addresses.mapHint}</p>
      </div>

      <textarea
        value={directions}
        onChange={(e) => setDirections(e.target.value)}
        placeholder={t.addresses.directions}
        rows={2}
        className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        onClick={sendCode}
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground disabled:opacity-50"
      >
        {busy ? t.common.loading : t.addresses.sendCode}
      </button>
    </div>
  );
}
