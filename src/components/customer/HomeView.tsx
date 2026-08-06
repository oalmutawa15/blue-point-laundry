"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { RequestPickup } from "./RequestPickup";
import { OrderCard } from "./OrderCard";
import type { Tables } from "@/types/database";

export function HomeView({
  addresses,
  activeOrder,
}: {
  addresses: Tables<"addresses">[];
  activeOrder: Tables<"orders"> | null;
}) {
  const { t } = useLang();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t.home.requestPickup}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t.home.requestPickupDesc}
        </p>
      </div>

      <RequestPickup addresses={addresses} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">{t.home.activeOrder}</h2>
          <Link href="/orders" className="text-sm font-semibold text-brand">
            {t.home.viewAll}
          </Link>
        </div>
        {activeOrder ? (
          <OrderCard order={activeOrder} />
        ) : (
          <p className="rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground">
            {t.home.noActiveOrders}
          </p>
        )}
      </div>
    </div>
  );
}
