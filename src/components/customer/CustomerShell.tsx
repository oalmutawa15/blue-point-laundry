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
  const common = "h-6 w-6";
  switch (name) {
    case "home":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
      );
    case "orders":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
      );
    case "addresses":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
      );
    case "credit":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>
      );
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

  const nav = [
    { href: "/home", label: t.nav.home, icon: "home" as const },
    { href: "/orders", label: t.nav.orders, icon: "orders" as const },
    { href: "/addresses", label: t.nav.addresses, icon: "addresses" as const },
    { href: "/credit", label: t.nav.credit, icon: "credit" as const },
  ];

  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-xl">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-brand px-4 py-3 text-brand-foreground">
        <Link href="/home" className="flex items-center gap-2">
          <Image src="/blue-point-logo.png" alt={t.brandFull} width={36} height={36} className="h-8 w-8 rounded object-contain" />
          <span className="text-base font-extrabold">{t.brand}</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/credit"
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold tabular-nums transition-colors hover:bg-white/25"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>
            {formatMoney(creditFils, lang)}
          </Link>
          <LanguageToggle />
          <button
            type="button"
            onClick={handleSignOut}
            aria-label={t.common.signOut}
            className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 px-4 py-5 pb-24">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-card">
        <div className="grid grid-cols-4">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
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
    </div>
  );
}
