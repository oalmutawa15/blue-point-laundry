"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { formatMoney } from "@/lib/money";
import { signOut } from "@/app/actions/auth";
import { ChatWidget } from "./ChatWidget";
import type { ReactNode } from "react";

type IconName = "home" | "orders" | "addresses" | "credit" | "prices" | "locations" | "profile" | "preferences" | "offers";

function NavIcon({ name }: { name: IconName }) {
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
    case "prices":
      return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4l11 11a2 2 0 0 0 3 0l4-4a2 2 0 0 0 0-3L10 2Z" /><circle cx="7.5" cy="7.5" r="1" fill="currentColor" /></svg>;
    case "locations":
      return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "profile":
      return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    case "preferences":
      return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 6.5a9 9 0 0 0-2.6-2.6L16 5a7 7 0 0 0-1.4-.6L14 2h-4l-.6 2.4A7 7 0 0 0 8 5l-2.2-1.1A9 9 0 0 0 3.2 6.5L5 8a7 7 0 0 0 0 8l-1.8 1.5a9 9 0 0 0 2.6 2.6L8 19a7 7 0 0 0 1.4.6L10 22h4l.6-2.4A7 7 0 0 0 16 19l2.2 1.1a9 9 0 0 0 2.6-2.6L19 16a7 7 0 0 0 0-8Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
    case "offers":
      return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.4 13 21a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 2.6 12L3 4l8-.4L20.6 11a2 2 0 0 1 0 2.4Z" /><circle cx="7.5" cy="7.5" r="1" fill="currentColor" /></svg>;
  }
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
  const [menuOpen, setMenuOpen] = useState(false);

  // Full nav (desktop sidebar + mobile drawer).
  const nav = [
    { href: "/home", label: t.nav.home, icon: "home" as const },
    { href: "/orders", label: t.nav.orders, icon: "orders" as const },
    { href: "/addresses", label: t.nav.addresses, icon: "addresses" as const },
    { href: "/credit", label: t.nav.credit, icon: "credit" as const },
  ];
  const moreNav = [
    { href: "/prices", label: t.nav.prices, icon: "prices" as const },
    { href: "/preferences", label: t.nav.preferences, icon: "preferences" as const },
    { href: "/offers", label: t.nav.offers, icon: "offers" as const },
    { href: "/locations", label: t.nav.locations, icon: "locations" as const },
    { href: "/profile", label: t.nav.profile, icon: "profile" as const },
  ];
  // Mobile bottom bar: Orders / Home / Profile (Home centered & elevated).
  const bottomNav = [
    { href: "/orders", label: t.nav.orders, icon: "orders" as const },
    { href: "/home", label: t.nav.home, icon: "home" as const },
    { href: "/profile", label: t.nav.profile, icon: "profile" as const },
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
            {[...nav, ...moreNav].map((item) => (
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={t.nav.more}
                className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/10"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <Link href="/home" className="flex items-center gap-2">
                <Image src="/blue-point-logo.png" alt={t.brandFull} width={36} height={36} className="h-8 w-8 rounded object-contain" />
                <span className="text-base font-extrabold">{t.brand}</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <SignOutBtn className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10" />
            </div>
          </header>

          {/* Mobile slide-in drawer */}
          {menuOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                aria-label="close"
                onClick={() => setMenuOpen(false)}
                className="absolute inset-0 bg-black/40"
              />
              <div className="absolute inset-y-0 start-0 flex w-72 max-w-[80%] flex-col bg-card p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image src="/blue-point-logo.png" alt={t.brandFull} width={36} height={36} className="h-9 w-9 rounded object-contain" />
                    <span className="text-base font-extrabold text-brand">{t.brand}</span>
                  </div>
                  <button type="button" onClick={() => setMenuOpen(false)} aria-label="close" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {[...nav, ...moreNav].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                        isActive(item.href) ? "bg-brand/10 text-brand" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <NavIcon name={item.icon} />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          )}

          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-24 lg:px-8 lg:py-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation: Orders / Home / Profile */}
      <nav className="fixed bottom-0 left-0 z-20 w-full border-t border-border bg-card lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 items-end">
          {bottomNav.map((item) => {
            const active = isActive(item.href);
            if (item.icon === "home") {
              return (
                <div key={item.href} className="flex justify-center">
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={`-mt-6 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-4 ring-card ${
                      active ? "bg-brand text-brand-foreground" : "bg-brand text-brand-foreground"
                    }`}
                  >
                    <NavIcon name="home" />
                  </Link>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  active ? "text-brand" : "text-muted-foreground"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <ChatWidget />
    </div>
  );
}
