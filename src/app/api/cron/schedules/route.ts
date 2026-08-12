import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kuwaitDate, kuwaitWeekday } from "@/lib/dispatch";
import { notifyNewOrder, notifyReadyForDelivery, notifyScheduledPickupSkipped } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Runs early each morning (Kuwait) via Vercel Cron. Materializes recurring weekly
// schedules whose day-of-week is today:
//   • pickup schedules  → auto-create a pickup request from the customer's
//                         default (or chosen) address, if their wallet is funded.
//   • delivery schedules → dispatch that customer's READY orders for delivery
//                          today, via the schedule's assigned driver.
// Guarded by CRON_SECRET (Vercel sends it as a Bearer token on cron runs).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = kuwaitDate(0);
  const weekday = kuwaitWeekday();
  const origin = (() => {
    const host = req.headers.get("host") ?? "";
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    return host ? `${proto}://${host}` : "";
  })();

  // Active schedules that include today's weekday and haven't run yet today.
  const { data: schedules, error } = await admin
    .from("recurring_schedules")
    .select("*")
    .eq("active", true)
    .contains("weekdays", [weekday]);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const due = (schedules ?? []).filter((s) => s.last_run_date !== today);

  let pickupsCreated = 0;
  let deliveriesDispatched = 0;
  let skipped = 0;

  for (const s of due) {
    try {
      if (s.kind === "pickup") {
        // Resolve the pickup address: the schedule's address, else the default.
        let addressId = s.address_id;
        if (addressId) {
          const { data: addr } = await admin
            .from("addresses")
            .select("id")
            .eq("id", addressId)
            .eq("customer_id", s.customer_id)
            .maybeSingle();
          if (!addr) addressId = null;
        }
        if (!addressId) {
          const { data: def } = await admin
            .from("addresses")
            .select("id")
            .eq("customer_id", s.customer_id)
            .eq("is_default", true)
            .maybeSingle();
          addressId = def?.id ?? null;
        }
        if (!addressId) {
          skipped++;
        } else {
          // Prepaid gate: only auto-place when the wallet is funded.
          const { data: prof } = await admin
            .from("profiles")
            .select("credit_fils")
            .eq("id", s.customer_id)
            .single();
          if (!prof || prof.credit_fils <= 0) {
            skipped++;
            if (origin) await notifyScheduledPickupSkipped(s.customer_id, origin);
          } else {
            const { data: order } = await admin
              .from("orders")
              .insert({
                customer_id: s.customer_id,
                pickup_address_id: addressId,
                status: "new",
                customer_note: "Scheduled pickup",
              })
              .select("id, order_no")
              .single();
            if (order) {
              pickupsCreated++;
              await notifyNewOrder(order.id, order.order_no);
            }
          }
        }
      } else if (s.kind === "delivery") {
        // Dispatch every READY order of this customer for delivery today.
        const { data: ready } = await admin
          .from("orders")
          .select("id, order_no")
          .eq("customer_id", s.customer_id)
          .eq("status", "ready");
        for (const o of ready ?? []) {
          const { error: upErr } = await admin
            .from("orders")
            .update({
              status: "delivering",
              delivery_driver_id: s.driver_id,
              dispatch_date: today,
            })
            .eq("id", o.id);
          if (upErr) {
            // e.g. CUSTOMER_IN_DEBT — leave it ready and skip.
            skipped++;
            continue;
          }
          deliveriesDispatched++;
          if (s.driver_id) await notifyReadyForDelivery(o.id, o.order_no, s.driver_id);
        }
      }
    } catch {
      skipped++;
    }
    // Stamp the run so a schedule fires at most once per day, even on retries.
    await admin.from("recurring_schedules").update({ last_run_date: today }).eq("id", s.id);
  }

  return NextResponse.json({
    ok: true,
    weekday,
    schedules: due.length,
    pickupsCreated,
    deliveriesDispatched,
    skipped,
  });
}
