"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { isValidKwPhone } from "@/lib/phone";
import { signInWithPhone } from "@/app/actions/auth";

export default function LoginPage() {
  const { t, dir } = useLang();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidKwPhone(phone);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!valid) return;
    setSubmitting(true);
    const res = await signInWithPhone(phone);
    if (!res.ok) {
      setSubmitting(false);
      setError(res.error === "invalid_phone" ? t.login.invalidPhone : res.error);
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
              className="flex items-stretch overflow-hidden rounded-xl border border-border bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
              dir="ltr"
            >
              <span className="flex items-center gap-1 bg-muted px-3 text-sm font-semibold text-muted-foreground">
                🇰🇼 +965
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder={t.login.phonePlaceholder}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                onBlur={() => setTouched(true)}
                className="w-full bg-transparent px-3 py-3 text-base tabular-nums outline-none"
                style={{ textAlign: dir === "rtl" ? "right" : "left" }}
              />
            </div>
            {touched && !valid && phone.length > 0 && (
              <p className="mt-1.5 text-sm text-danger">{t.login.invalidPhone}</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!valid || submitting}
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
