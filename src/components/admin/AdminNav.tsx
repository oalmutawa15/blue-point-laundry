"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { signOut } from "@/app/actions/auth";

export function AdminNav() {
  const { t } = useLang();
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/admin", label: t.admin.nav.dashboard },
    { href: "/admin/team", label: t.admin.nav.team },
    { href: "/admin/customers", label: t.admin.nav.customers },
    { href: "/admin/settings", label: t.admin.nav.settings },
    { href: "/admin/activity", label: t.admin.nav.activity },
  ];

  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 bg-brand text-brand-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold">{t.brand}</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
            {t.admin.superAdmin}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
      </div>
      <nav className="mx-auto max-w-6xl overflow-x-auto px-2">
        <div className="flex gap-1 pb-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-bold transition-colors ${
                  active ? "bg-background text-brand" : "text-white/80 hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
