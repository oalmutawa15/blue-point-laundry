"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Subscribes to live changes on the orders table and refreshes the current
// server-rendered view whenever an order is created or its status changes — so
// the shop board, customer orders, and driver jobs update without a manual
// refresh. Realtime respects RLS, so each role only receives the orders it can
// already see. `key` just namespaces the channel per screen.
//
// Refreshes are debounced (~400ms): a burst of changes coalesces into a single
// refetch instead of one per event. Still feels live, but far lighter on a busy
// board. Behavior is otherwise unchanged — every change still triggers a refresh.
export function useRealtimeOrders(key: string) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        router.refresh();
      }, 400);
    };
    const channel = supabase
      .channel(`orders-${key}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        scheduleRefresh,
      )
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [key, router]);
}
