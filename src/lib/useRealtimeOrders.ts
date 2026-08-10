"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Subscribes to live changes on the orders table and refreshes the current
// server-rendered view whenever an order is created or its status changes — so
// the shop board, customer orders, and driver jobs update without a manual
// refresh. Realtime respects RLS, so each role only receives the orders it can
// already see. `key` just namespaces the channel per screen.
export function useRealtimeOrders(key: string) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`orders-${key}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [key, router]);
}
