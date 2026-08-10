"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";

export function ReceiptNotFound() {
  const { t } = useLang();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
        {t.publicReceipt.notFound}
      </p>
    </main>
  );
}
