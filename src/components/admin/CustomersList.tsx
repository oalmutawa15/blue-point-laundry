"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";
import type { Tables } from "@/types/database";

export function CustomersList({
  customers,
}: {
  customers: Pick<Tables<"profiles">, "id" | "full_name" | "phone" | "credit_fils">[];
}) {
  const { t, lang } = useLang();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t.admin.customers.title}</h1>
      <div className="divide-y divide-border rounded-2xl bg-card shadow-sm">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/admin/customers/${c.id}`}
            className="flex items-center justify-between p-4 transition-colors hover:bg-muted"
          >
            <div>
              <p className="font-semibold">{c.full_name || "—"}</p>
              <p dir="ltr" className="text-sm text-muted-foreground">{c.phone}</p>
            </div>
            <span
              className={`font-bold tabular-nums ${c.credit_fils < 0 ? "text-danger" : "text-foreground"}`}
            >
              {formatMoney(c.credit_fils, lang)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
