"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { signOut } from "@/app/actions/auth";

export function StaffTopBar({
  area,
  home,
}: {
  area: "shop" | "driver";
  home: string;
}) {
  const { t } = useLang();
  const router = useRouter();
  const label = area === "shop" ? t.shop.title : t.driver.title;

  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-brand px-4 py-3 text-brand-foreground">
      <Link href={home} className="flex items-center gap-2">
        <Image
          src="/blue-point-logo.png"
          alt={t.brandFull}
          width={32}
          height={32}
          className="h-8 w-8 rounded object-contain"
        />
        <div>
          <p className="text-sm font-extrabold leading-none">{t.brand}</p>
          <p className="mt-0.5 text-xs text-white/70">{label}</p>
        </div>
      </Link>
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
    </header>
  );
}
