"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { statusLabel } from "@/lib/orderStatus";
import type { OrderStatus, Tables } from "@/types/database";

// The exact stages the shop works through, in order. The customer sees the same
// sequence and labels, so their view matches the shop's exactly.
const STAGES: OrderStatus[] = [
  "new",
  "pickup_requested",
  "picked_up",
  "counting",
  "washing",
  "ready",
  "delivering",
  "delivered",
];

// Self-pickup orders never go through a delivery stage.
const SELF_PICKUP_STAGES: OrderStatus[] = STAGES.filter((s) => s !== "delivering");

export function OrderProgress({
  status,
  events,
  fulfillment,
}: {
  status: OrderStatus;
  events: Tables<"order_events">[];
  fulfillment?: string | null;
}) {
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar-KW" : "en-GB";
  const fmtTime = (s: string) =>
    new Date(s).toLocaleString(locale, {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  // Earliest timestamp recorded for each stage (from the order history).
  const times: Partial<Record<OrderStatus, string>> = {};
  for (const e of events) {
    const prev = times[e.status];
    if (!prev || +new Date(e.created_at) < +new Date(prev)) times[e.status] = e.created_at;
  }

  if (status === "cancelled") {
    const at = times.cancelled;
    return (
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/15 text-danger">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </span>
          <div>
            <p className="font-bold text-danger">{t.status.cancelled}</p>
            {at && <p className="text-xs text-muted-foreground">{fmtTime(at)}</p>}
          </div>
        </div>
      </div>
    );
  }

  const stages = fulfillment === "self_pickup" ? SELF_PICKUP_STAGES : STAGES;
  const currentIndex = stages.indexOf(status);

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <h2 className="mb-4 font-bold">{t.orders.timeline}</h2>
      <ol className="space-y-0">
        {stages.map((stage, i) => {
          const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
          const isLast = i === stages.length - 1;
          const at = times[stage];
          return (
            <li key={stage} className="flex gap-3">
              {/* Rail: dot + connecting line */}
              <div className="flex flex-col items-center">
                <span
                  className={
                    state === "upcoming"
                      ? "flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-card"
                      : "flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-foreground"
                  }
                >
                  {state === "done" ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5" /></svg>
                  ) : state === "current" ? (
                    <span className="h-2 w-2 rounded-full bg-brand-foreground" />
                  ) : null}
                </span>
                {!isLast && (
                  <span
                    className={`w-0.5 flex-1 ${i < currentIndex ? "bg-brand" : "bg-border"}`}
                    style={{ minHeight: "1.5rem" }}
                  />
                )}
              </div>

              {/* Label + time */}
              <div className={`pb-5 ${state === "upcoming" ? "opacity-50" : ""}`}>
                <p
                  className={
                    state === "current"
                      ? "font-extrabold text-brand"
                      : "font-semibold"
                  }
                >
                  {statusLabel(t.status, stage, fulfillment)}
                </p>
                {at ? (
                  <p className="text-xs text-muted-foreground">{fmtTime(at)}</p>
                ) : state === "current" ? (
                  <p className="text-xs text-brand">{t.orders.inProgress}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
