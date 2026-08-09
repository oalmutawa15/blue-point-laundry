"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { DEFAULT_DIAL } from "@/lib/countries";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import { signInWithPhone, phoneNeedsPassword } from "@/app/actions/auth";

export default function LoginPage() {
  const { t, dir, lang } = useLang();
  const router = useRouter();
  const [dial, setDial] = useState(DEFAULT_DIAL);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [name, setName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidPhone(phone, dial);
  const maxLen = dial === "965" ? 8 : 12;
  const fullPhone = () => normalizePhone(phone, dial)?.e164 ?? `+${dial}${phone}`;

  // As soon as a full, valid number is typed, ask the server whether it's a
  // staff/admin/driver account. If so, reveal the password field right away —
  // customers never see it. Debounced so we don't check on every keystroke.
  useEffect(() => {
    if (!valid) {
      setNeedsPassword(false);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      const staff = await phoneNeedsPassword(fullPhone());
      if (active) setNeedsPassword(staff);
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, dial, valid]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!valid) return;
    setSubmitting(true);
    const res = await signInWithPhone(
      fullPhone(),
      needsPassword ? password : undefined,
      needsName ? name : undefined,
    );
    if (!res.ok) {
      setSubmitting(false);
      if (res.error === "password_required") {
        setNeedsPassword(true); // reveal the password field for staff/admin
        return;
      }
      if (res.error === "name_required") {
        setNeedsName(true); // first-time customer: ask for their name
        return;
      }
      setError(
        res.error === "invalid_phone"
          ? t.login.invalidPhone
          : res.error === "wrong_password"
            ? t.login.wrongPassword
            : res.error,
      );
      return;
    }
    router.replace(res.redirect);
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-brand px-5 py-10">
      <div className="absolute top-4 ltr:right-4 rtl:left-4">
        <LanguageToggle />
      </div>

      {/* Brand lockup */}
      <div className="mb-2 flex flex-col items-center">
        <Image
          src="/blue-point-logo.png"
          alt={t.brandFull}
          width={260}
          height={462}
          priority
          className="h-56 w-auto object-contain"
        />
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl shadow-brand-800/30">
        <h1 className="text-xl font-extrabold text-foreground">{t.login.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.login.subtitle}</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t.login.phoneLabel}
            </label>
            <div
              className="flex items-stretch rounded-xl border border-border bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
              dir="ltr"
            >
              <CountryCodeSelect
                dial={dial}
                lang={lang}
                onChange={(d) => {
                  setDial(d);
                  setPhone("");
                  setNeedsPassword(false);
                  setPassword("");
                }}
              />
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder={t.login.phonePlaceholder}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, maxLen))
                }
                onBlur={() => setTouched(true)}
                className="w-full rounded-r-xl bg-transparent px-3 py-3 text-base tabular-nums outline-none"
                style={{ textAlign: dir === "rtl" ? "right" : "left" }}
              />
            </div>
            {touched && !valid && phone.length > 0 && (
              <p className="mt-1.5 text-sm text-danger">{t.login.invalidPhone}</p>
            )}
          </div>

          {needsPassword && (
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                {t.login.password}
              </label>
              <input
                id="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                placeholder={t.login.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{t.login.staffHint}</p>
            </div>
          )}

          {needsName && (
            <div>
              <label htmlFor="fullname" className="mb-1.5 block text-sm font-medium text-foreground">
                {t.login.fullName}
              </label>
              <input
                id="fullname"
                type="text"
                autoFocus
                autoComplete="name"
                placeholder={t.login.fullNamePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{t.login.nameHint}</p>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!valid || submitting || (needsPassword && !password) || (needsName && !name.trim())}
            className="w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-brand-foreground transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t.common.loading : t.login.continue}
          </button>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            {t.login.terms}
          </p>
        </form>
      </div>

      <p className="mt-6 text-sm font-medium text-white/70">{t.tagline}</p>
    </main>
  );
}
