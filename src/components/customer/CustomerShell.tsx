"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { formatMoney } from "@/lib/money";
import { signOut } from "@/app/actions/auth";
import type { ReactNode } from "react";

function NavIcon({ name }: { name: "home" | "orders" | "addresses" | "credit" }) {
  const c = "h-6 w-6";
  switch (name) {
    case "home":
      return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>;
    case "orders":
      return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
    case "addresses":
      return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "credit":
      return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>;
  }
}

function CreditChip({ creditFils }: { creditFils: number }) {
  const { t, lang } = useLang();
  return (
    <Link
      href="/credit"
      className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold tabular-nums transition-colors hover:bg-white/25"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>
      {formatMoney(creditFils, lang)}
      <span className="sr-only">{t.nav.credit}</span>
    </Link>
  );
}

export function CustomerShell({
  children,
  creditFils,
}: {
  children: ReactNode;
  creditFils: number;
}) {
  const { t, lang } = useLang();
  const pathname = usePathname();
  const router = useRouter();

  const nav = [
    { href: "/home", label: t.nav.home, icon: "home" as const },
    { href: "/orders", label: t.nav.orders, icon: "orders" as const },
    { href: "/addresses", label: t.nav.addresses, icon: "addresses" as const },
    { href: "/credit", label: t.nav.credit, icon: "credit" as const },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  const SignOutBtn = ({ className = "" }: { className?: string }) => (
    <button type="button" onClick={handleSignOut} aria-label={t.common.signOut} className={className}>
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand p-5 text-brand-foreground lg:flex">
          <Link href="/home" className="mb-6 flex items-center gap-2">
            <Image src="/blue-point-logo.png" alt={t.brandFull} width={40} height={40} className="h-10 w-10 rounded object-contain" />
            <div>
              <p className="text-base font-extrabold leading-none">{t.brand}</p>
              <p className="mt-1 text-xs text-white/70">{t.tagline}</p>
            </div>
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                  isActive(item.href) ? "bg-white/20" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 space-y-3">
            <Link href="/credit" className="block rounded-xl bg-white/10 p-3">
              <p className="text-xs text-white/70">{t.credit.balance}</p>
              <p className="text-lg font-extrabold tabular-nums">
                {formatMoney(creditFils, lang)}
              </p>
            </Link>
            <div className="flex items-center justify-between">
              <LanguageToggle />
              <SignOutBtn className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10" />
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-brand px-4 py-3 text-brand-foreground lg:hidden">
            <Link href="/home" className="flex items-center gap-2">
              <Image src="/blue-point-logo.png" alt={t.brandFull} width={36} height={36} className="h-8 w-8 rounded object-contain" />
              <span className="text-base font-extrabold">{t.brand}</span>
            </Link>
            <div className="flex items-center gap-2">
              <CreditChip creditFils={creditFils} />
              <LanguageToggle />
              <SignOutBtn className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10" />
            </div>
          </header>

          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-24 lg:px-8 lg:py-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 z-20 w-full border-t border-border bg-card lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                isActive(item.href) ? "text-brand" : "text-muted-foreground"
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
