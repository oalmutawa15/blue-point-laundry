"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { KUWAIT_AREAS, numberRange, toArabicDigits } from "@/lib/kuwait";
import { requestAddressOtp, addAddress } from "@/app/actions/addresses";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

type Opt = { value: string; label: string };

async function geocodeReverse(lat: number, lng: number) {
  const res = await fetch(`/api/geocode?mode=reverse&lat=${lat}&lng=${lng}`);
  return (await res.json()) as { area?: string; block?: string; street?: string; building?: string };
}
async function geocodeSearch(area: string, block: string, street: string) {
  const res = await fetch(
    `/api/geocode?mode=search&area=${encodeURIComponent(area)}&block=${encodeURIComponent(block)}&street=${encodeURIComponent(street)}`,
  );
  return (await res.json()) as { lat: number | null; lng: number | null };
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
  const [locating, setLocating] = useState(false);

  const [otpStage, setOtpStage] = useState(false);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "map" = fields were just set by dragging the pin (skip forward geocode);
  // "fields" = user typed, so we should move the map.
  const source = useRef<"map" | "fields" | null>(null);

  const num = (n: number) => (lang === "ar" ? toArabicDigits(n) : String(n));
  const areaOptions: Opt[] = useMemo(() => {
    const arr = [...KUWAIT_AREAS];
    arr.sort((a, b) => (lang === "ar" ? a.ar.localeCompare(b.ar) : a.en.localeCompare(b.en)));
    return arr.map((a) => ({ value: a.en, label: lang === "ar" ? a.ar : a.en }));
  }, [lang]);
  const floorOptions: Opt[] = [
    { value: "0", label: t.addresses.ground },
    ...numberRange(1, 30).map((n) => ({ value: String(n), label: num(n) })),
  ];
  const aptOptions: Opt[] = numberRange(1, 60).map((n) => ({ value: String(n), label: num(n) }));

  // Pin moved by the user → reverse geocode to fill the fields.
  function onPick(lat: number, lng: number) {
    setPin({ lat, lng });
    setLocating(true);
    geocodeReverse(lat, lng)
      .then((r) => {
        source.current = "map";
        if (r.area) {
          const match = KUWAIT_AREAS.find((a) => a.en.toLowerCase() === r.area!.toLowerCase());
          if (match) setAreaEn(match.en);
        }
        if (r.block) setBlock(r.block);
        if (r.street) setStreet(r.street);
        if (r.building) setBuilding(r.building);
      })
      .finally(() => setLocating(false));
  }

  // Fields changed by the user → move the map to them (debounced).
  useEffect(() => {
    if (source.current === "map") {
      source.current = null;
      return;
    }
    if (!areaEn) return;
    const handle = setTimeout(async () => {
      setLocating(true);
      const r = await geocodeSearch(areaEn, block, street);
      if (r.lat != null && r.lng != null) {
        setPin({ lat: r.lat, lng: r.lng });
        setFlyTo({ lat: r.lat, lng: r.lng, key: Date.now() });
      }
      setLocating(false);
    }, 900);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaEn, block, street]);

  const edit = (setter: (v: string) => void) => (v: string) => {
    source.current = "fields";
    setter(v);
  };

  async function sendCode() {
    setError(null);
    if (!areaEn) return setError(t.common.required + ": " + t.addresses.area);
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

  const fieldCls =
    "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";
  const lbl = "mb-1 block text-xs font-semibold text-muted-foreground";

  return (
    <div className="space-y-3">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t.addresses.label}
        className={fieldCls}
      />

      <div>
        <label className={lbl}>{t.addresses.area}</label>
        <select value={areaEn} onChange={(e) => edit(setAreaEn)(e.target.value)} className={fieldCls}>
          <option value="">{t.addresses.selectArea}</option>
          {areaOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>{t.addresses.block}</label>
          <input value={block} onChange={(e) => edit(setBlock)(e.target.value)} inputMode="numeric" className={fieldCls} />
        </div>
        <div>
          <label className={lbl}>{t.addresses.street}</label>
          <input value={street} onChange={(e) => edit(setStreet)(e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className={lbl}>{t.addresses.building}</label>
          <input value={building} onChange={(e) => setBuilding(e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className={lbl}>{t.addresses.floor}</label>
          <select value={floor} onChange={(e) => setFloor(e.target.value)} className={fieldCls}>
            <option value="">{t.addresses.choose}</option>
            {floorOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>{t.addresses.apartment}</label>
          <select value={apartment} onChange={(e) => setApartment(e.target.value)} className={fieldCls}>
            <option value="">{t.addresses.choose}</option>
            {aptOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className={lbl + " mb-0"}>{t.addresses.mapTitle}</label>
          {locating && <span className="text-xs text-muted-foreground">{t.common.loading}</span>}
        </div>
        <LocationMap initial={pin} flyTo={flyTo} onPick={onPick} />
        <p className="mt-1 text-xs text-muted-foreground">{t.addresses.mapHint}</p>
      </div>

      <textarea
        value={directions}
        onChange={(e) => setDirections(e.target.value)}
        placeholder={t.addresses.directions}
        rows={2}
        className={fieldCls + " resize-none"}
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
