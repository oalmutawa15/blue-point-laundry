"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { formatMoney } from "@/lib/money";
import { OrderStatusBadge } from "@/components/customer/OrderStatusBadge";
import { RevenueChart, type DayRevenue } from "./RevenueChart";
import type { OrderStatus } from "@/types/database";

export type AdminStats = {
  orders_today: number;
  completed_today: number;
  pending_pickups: number;
  cleaning: number;
  ready_delivery: number;
  cancelled_total: number;
  active_customers: number;
  total_customers: number;
  new_customers_month: number;
  returning_customers: number;
  orders_total: number;
  total_drivers: number;
  active_drivers: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  orders_charged: number;
  avg_order_value: number;
  wallet_held: number;
  total_topups: number;
  total_deductions: number;
  revenue_daily: DayRevenue[];
};

export type DriverPerf = {
  id: string;
  name: string;
  pickups: number;
  deliveries: number;
  active: number;
  delayed: number;
  total: number;
};

export type TodayRow = {
  id: string;
  order_no: string;
  customer: string;
  area: string;
  driver: string | null;
  status: OrderStatus;
  value_fils: number | null;
  delivery_date: string | null;
};

export type AlertItem = {
  kind: "unassigned" | "overdueDelivery" | "waitingAtShop" | "negativeCredit" | "lowCredit";
  ref: string;
  href?: string;
};

export type TopCustomer = { id: string; name: string; count: number };

function StatCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warn" | "good" }) {
  const toneCls =
    tone === "warn" ? "text-warning" : tone === "good" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${toneCls}`}>{value}</p>
    </div>
  );
}

export function DashboardView({
  stats,
  costPct,
  drivers,
  today,
  alerts,
  topCustomers,
}: {
  stats: AdminStats;
  costPct: number;
  drivers: DriverPerf[];
  today: TodayRow[];
  alerts: AlertItem[];
  topCustomers: TopCustomer[];
}) {
  const { t, lang } = useLang();
  const m = (f: number) => formatMoney(f, lang);
  const profit = (f: number) => f * (1 - costPct / 100);
  const retention =
    stats.total_customers > 0
      ? Math.round((stats.returning_customers / stats.total_customers) * 100)
      : 0;
  const avgOrders =
    stats.total_customers > 0
      ? (stats.orders_total / stats.total_customers).toFixed(1)
      : "0";
  const locale = lang === "ar" ? "ar-KW" : "en-GB";

  const kpis = [
    { label: t.admin.kpi.ordersToday, value: String(stats.orders_today) },
    { label: t.admin.kpi.completed, value: String(stats.completed_today), tone: "good" as const },
    { label: t.admin.kpi.pendingPickups, value: String(stats.pending_pickups) },
    { label: t.admin.kpi.cleaning, value: String(stats.cleaning) },
    { label: t.admin.kpi.readyDelivery, value: String(stats.ready_delivery) },
    { label: t.admin.kpi.cancelled, value: String(stats.cancelled_total), tone: "warn" as const },
    { label: t.admin.kpi.activeCustomers, value: String(stats.active_customers) },
    { label: t.admin.kpi.totalDrivers, value: String(stats.total_drivers) },
    { label: t.admin.kpi.activeDrivers, value: String(stats.active_drivers) },
  ];

  const fin = [
    { label: t.admin.fin.revenueToday, value: m(stats.revenue_today) },
    { label: t.admin.fin.dailyProfit, value: m(profit(stats.revenue_today)), tone: "good" as const },
    { label: t.admin.fin.revenueWeek, value: m(stats.revenue_week) },
    { label: t.admin.fin.revenueMonth, value: m(stats.revenue_month) },
    { label: t.admin.fin.netProfitMonth, value: m(profit(stats.revenue_month)), tone: "good" as const },
    { label: t.admin.fin.avgOrder, value: m(stats.avg_order_value) },
    { label: t.admin.fin.walletHeld, value: m(stats.wallet_held) },
    { label: t.admin.fin.totalTopups, value: m(stats.total_topups) },
    { label: t.admin.fin.totalDeductions, value: m(stats.total_deductions) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">{t.admin.title}</h1>

      {/* KPIs */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">{t.admin.kpi.title}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k) => (
            <StatCard key={k.label} label={k.label} value={k.value} tone={k.tone} />
          ))}
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">{t.admin.alerts.title}</h2>
        {alerts.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">{t.admin.alerts.none}</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((a, i) => {
              const body = (
                <div className="flex items-center gap-3 rounded-xl bg-warning/10 px-4 py-3 text-sm">
                  <span className="text-warning">⚠️</span>
                  <span className="font-semibold text-foreground">{t.admin.alerts[a.kind]}</span>
                  <span className="ms-auto tabular-nums text-muted-foreground">{a.ref}</span>
                </div>
              );
              return a.href ? (
                <Link key={i} href={a.href}>{body}</Link>
              ) : (
                <div key={i}>{body}</div>
              );
            })}
          </div>
        )}
      </section>

      {/* Financial */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">
          {t.admin.fin.title}{" "}
          <span className="font-normal">· {t.admin.fin.profit} {t.admin.fin.estimated} {100 - costPct}%</span>
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fin.map((f) => (
            <StatCard key={f.label} label={f.label} value={f.value} tone={f.tone} />
          ))}
        </div>
      </section>

      <RevenueChart data={stats.revenue_daily} costPct={costPct} />

      {/* Customers */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">{t.admin.cust.title}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t.admin.cust.newThisMonth} value={String(stats.new_customers_month)} />
          <StatCard label={t.admin.cust.returning} value={String(stats.returning_customers)} />
          <StatCard label={t.admin.cust.avgOrders} value={avgOrders} />
          <StatCard label={t.admin.cust.retention} value={`${retention}%`} />
        </div>
        {topCustomers.length > 0 && (
          <div className="mt-3 rounded-2xl bg-card p-4 shadow-sm">
            <p className="mb-2 text-sm font-bold">{t.admin.cust.mostActive}</p>
            <div className="divide-y divide-border">
              {topCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{c.name}</span>
                  <span className="tabular-nums text-muted-foreground">{c.count} {t.admin.cust.orders}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Driver performance */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">{t.admin.drivers.title}</h2>
        <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="p-3 text-start">{t.admin.drivers.driver}</th>
                <th className="p-3 tabular-nums">{t.admin.drivers.pickups}</th>
                <th className="p-3 tabular-nums">{t.admin.drivers.deliveries}</th>
                <th className="p-3 tabular-nums">{t.admin.drivers.active}</th>
                <th className="p-3 tabular-nums">{t.admin.drivers.delayed}</th>
                <th className="p-3 tabular-nums">{t.admin.drivers.total}</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-semibold">{d.name}</td>
                  <td className="p-3 text-center tabular-nums">{d.pickups}</td>
                  <td className="p-3 text-center tabular-nums">{d.deliveries}</td>
                  <td className="p-3 text-center tabular-nums">{d.active}</td>
                  <td className={`p-3 text-center tabular-nums ${d.delayed ? "text-warning font-bold" : ""}`}>{d.delayed}</td>
                  <td className="p-3 text-center tabular-nums">{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Orders today */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">{t.admin.today.title}</h2>
        {today.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">{t.admin.today.none}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="p-3 text-start">{t.admin.today.order}</th>
                  <th className="p-3 text-start">{t.admin.today.customer}</th>
                  <th className="p-3 text-start">{t.admin.today.area}</th>
                  <th className="p-3 text-start">{t.admin.today.driver}</th>
                  <th className="p-3 text-start">{t.admin.today.status}</th>
                  <th className="p-3 text-start">{t.admin.today.value}</th>
                </tr>
              </thead>
              <tbody>
                {today.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <Link href={`/shop/orders/${o.id}`} className="font-bold tabular-nums text-brand">
                        {o.order_no}
                      </Link>
                    </td>
                    <td className="p-3">{o.customer}</td>
                    <td className="p-3 text-muted-foreground">{o.area || "—"}</td>
                    <td className="p-3">{o.driver || t.admin.today.unassigned}</td>
                    <td className="p-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="p-3 tabular-nums">{o.value_fils != null ? m(o.value_fils) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
