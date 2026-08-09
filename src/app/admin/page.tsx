import { createClient } from "@/lib/supabase/server";
import {
  DashboardView,
  type AdminStats,
  type DriverPerf,
  type TodayRow,
  type AlertItem,
} from "@/components/admin/DashboardView";
import type { OrderStatus } from "@/types/database";

const ACTIVE_PICKUP = "pickup_requested";
const PAST_PICKUP: OrderStatus[] = [
  "picked_up", "counting", "awaiting_payment", "washing", "ready", "delivering", "delivered",
];

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [statsRes, settingsRes, ordersRes, driversRes, customersRes] = await Promise.all([
    supabase.rpc("admin_dashboard_stats"),
    supabase.from("settings").select("value").eq("key", "cost_pct").single(),
    supabase
      .from("orders")
      .select(
        "id, order_no, status, price_fils, delivery_date, created_at, updated_at, customer_id, pickup_driver_id, delivery_driver_id, customer:customer_id(full_name, phone), pickup_address:pickup_address_id(area), pickup_driver:pickup_driver_id(full_name), delivery_driver:delivery_driver_id(full_name)",
      )
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, phone").eq("role", "driver"),
    supabase.from("profiles").select("id, full_name, phone, credit_fils").eq("role", "customer"),
  ]);

  const stats = (statsRes.data ?? {}) as AdminStats;
  const costPct = Number(settingsRes.data?.value ?? 40);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = (ordersRes.data ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driversRaw = (driversRes.data ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (customersRes.data ?? []) as any[];

  // Driver performance
  const drivers: DriverPerf[] = driversRaw.map((d) => {
    const pickups = orders.filter(
      (o) => o.pickup_driver_id === d.id && PAST_PICKUP.includes(o.status),
    ).length;
    const deliveries = orders.filter(
      (o) => o.delivery_driver_id === d.id && o.status === "delivered",
    ).length;
    const active = orders.filter(
      (o) =>
        (o.pickup_driver_id === d.id && o.status === ACTIVE_PICKUP) ||
        (o.delivery_driver_id === d.id && o.status === "delivering"),
    ).length;
    const delayed = orders.filter(
      (o) =>
        o.delivery_driver_id === d.id &&
        o.status === "delivered" &&
        o.delivery_date &&
        o.updated_at.slice(0, 10) > o.delivery_date,
    ).length;
    const total = orders.filter(
      (o) => o.pickup_driver_id === d.id || o.delivery_driver_id === d.id,
    ).length;
    return { id: d.id, name: d.full_name || d.phone, pickups, deliveries, active, delayed, total };
  });

  // Orders today
  const todayRows: TodayRow[] = orders
    .filter((o) => o.created_at.slice(0, 10) === today)
    .map((o) => ({
      id: o.id,
      order_no: o.order_no,
      customer: o.customer?.full_name || o.customer?.phone || "—",
      area: o.pickup_address?.area ?? "",
      driver:
        o.delivery_driver?.full_name || o.pickup_driver?.full_name || null,
      status: o.status,
      value_fils: o.price_fils,
      delivery_date: o.delivery_date,
    }));

  // Alerts engine
  const alerts: AlertItem[] = [];
  for (const o of orders) {
    if (o.status === "new") {
      alerts.push({ kind: "unassigned", ref: o.order_no, href: `/shop/orders/${o.id}` });
    } else if (
      o.status === "delivering" &&
      o.delivery_date &&
      o.delivery_date < today
    ) {
      alerts.push({ kind: "overdueDelivery", ref: o.order_no, href: `/shop/orders/${o.id}` });
    } else if (o.status === "picked_up" || o.status === "counting") {
      alerts.push({ kind: "waitingAtShop", ref: o.order_no, href: `/shop/orders/${o.id}` });
    }
  }
  for (const c of customers) {
    if (c.credit_fils < 0) {
      alerts.push({ kind: "negativeCredit", ref: c.full_name || c.phone, href: `/admin/customers/${c.id}` });
    } else if (c.credit_fils < 1000) {
      alerts.push({ kind: "lowCredit", ref: c.full_name || c.phone, href: `/admin/customers/${c.id}` });
    }
  }

  return (
    <DashboardView
      stats={stats}
      costPct={costPct}
      drivers={drivers}
      today={todayRows}
      alerts={alerts.slice(0, 12)}
    />
  );
}
