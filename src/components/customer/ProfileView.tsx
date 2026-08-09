"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { signOut } from "@/app/actions/auth";
import type { ReactNode } from "react";

type RowProps = { icon: ReactNode; label: string; href?: string; onClick?: () => void; right?: ReactNode; danger?: boolean };

function Row({ icon, label, href, onClick, right, danger }: RowProps) {
  const cls = `flex items-center gap-3 px-4 py-3.5 text-sm font-semibold ${
    danger ? "text-danger" : "text-foreground"
  }`;
  const inner = (
    <>
      <span className={danger ? "text-danger" : "text-brand"}>{icon}</span>
      <span className="flex-1 text-start">{label}</span>
      {right ?? (
        <svg className="h-4 w-4 text-muted-foreground rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      )}
    </>
  );
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={`w-full ${cls}`}>{inner}</button>;
  // Static row (e.g. holds a control like the language toggle on the right).
  return <div className={cls}>{inner}</div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-1 text-sm font-extrabold">{title}</p>
      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-sm">{children}</div>
    </div>
  );
}

const ic = (d: string) => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);

export function ProfileView({ name, phone }: { name: string | null; phone: string }) {
  const { t } = useLang();
  const router = useRouter();

  async function logOff() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{t.profile.title}</h1>

      {/* User card */}
      <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-xl font-extrabold text-brand-foreground">
          {(name?.trim()?.[0] ?? "؟").toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold">{name?.trim() || t.profile.title}</p>
          <p dir="ltr" className="text-sm text-muted-foreground">{phone}</p>
        </div>
      </div>

      <Section title={t.profile.account}>
        <Row icon={ic('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>')} label={t.profile.addressesLink} href="/addresses" />
        <Row icon={ic('<path d="M9 3H5a2 2 0 0 0-2 2v4l11 11a2 2 0 0 0 3 0l4-4a2 2 0 0 0 0-3L10 2Z"/>')} label={t.prices.title} href="/prices" />
        <Row icon={ic('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>')} label={t.nav.credit} href="/credit" />
        <Row icon={ic('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>')} label={t.locations.title} href="/locations" />
      </Section>

      <Section title={t.profile.settings}>
        <Row icon={ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>')} label={t.profile.language} right={<LanguageToggle />} />
      </Section>

      <Section title={t.profile.support}>
        <Row icon={ic('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>')} label={t.profile.logOff} onClick={logOff} danger />
      </Section>
    </div>
  );
}
