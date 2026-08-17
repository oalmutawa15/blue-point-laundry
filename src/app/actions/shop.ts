"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffProfile } from "@/lib/auth";
import {
  notifyPickupAssigned,
  notifyReadyForDelivery,
  notifyReadyForPickup,
  notifyCollected,
  notifyPickupReceived,
} from "@/lib/notify";
import { sendReceiptFor } from "@/lib/receipt";
import { nextDispatchDate } from "@/lib/dispatch";
import type { Database } from "@/types/database";

export type RefundType = "wallet" | "cash" | "none";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type Ok = { ok: true } | { ok: false; error: string };

export type ItemInput = {
  service: string;
  garment: string;
  qty: number;
  unit_price_fils: number;
};

function revalidate(orderId: string) {
  revalidatePath("/shop");
  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/driver");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

async function setStatus(orderId: string, status: OrderStatus, force = false): Promise<Ok> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    // `force` = the shop chose to proceed despite the customer being in debt.
    .update(force ? { status, debt_override: true } : { status })
    .eq("id", orderId);
  if (error) {
    if (/CUSTOMER_IN_DEBT/.test(error.message)) return { ok: false, error: "customer_in_debt" };
    if (/INSUFFICIENT_CREDIT/.test(error.message)) return { ok: false, error: "insufficient_credit" };
    return { ok: false, error: error.message };
  }
  // Customer is intentionally NOT messaged for these intermediate steps
  // (received / washing / ready) — they only get: picked up, receipt, delivered.
  revalidate(orderId);
  return { ok: true };
}

// new -> pickup_requested: assign a driver to pick up from the customer.
export async function assignPickupDriver(orderId: string, driverId: string): Promise<Ok> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  // Next-day dispatch: the driver only sees this from 00:00 (Kuwait) tomorrow.
  const { data, error } = await supabase
    .from("orders")
    .update({
      pickup_driver_id: driverId,
      status: "pickup_requested",
      dispatch_date: nextDispatchDate(),
    })
    .eq("id", orderId)
    .select("order_no")
    .single();
  if (error) return { ok: false, error: error.message };
  after(async () => {
    try {
      await notifyPickupAssigned(orderId, data.order_no, driverId);
    } catch {}
  });
  revalidate(orderId);
  return { ok: true };
}

// picked_up -> counting: clothes received at the shop, ready to be counted.
export async function markReceived(orderId: string): Promise<Ok> {
  const res = await setStatus(orderId, "counting");
  if (!res.ok) return res;
  // Tell the pickup driver the shop received the order they brought in — with the
  // reference + client name — so it drops off their "in the car" list.
  after(async () => {
    try {
      const admin = createAdminClient();
      const { data: o } = await admin
        .from("orders")
        .select("order_no, pickup_driver_id, customer:customer_id(full_name)")
        .eq("id", orderId)
        .single();
      const rel = o?.customer as { full_name: string | null } | { full_name: string | null }[] | null;
      const cust = Array.isArray(rel) ? rel[0] : rel;
      if (o?.pickup_driver_id) {
        await notifyPickupReceived(orderId, o.order_no, o.pickup_driver_id, cust?.full_name ?? null);
      }
    } catch {}
  });
  return res;
}

// counting -> awaiting_payment: record items, price and delivery date.
export async function saveIntake(
  orderId: string,
  items: ItemInput[],
  deliveryDate: string | null,
): Promise<Ok> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  if (!deliveryDate) return { ok: false, error: "date_required" };
  const supabase = await createClient();

  await supabase.from("order_items").delete().eq("order_id", orderId);
  if (items.length) {
    const { error: itemsErr } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: orderId,
        service: i.service,
        garment: i.garment || null,
        qty: i.qty,
        unit_price_fils: i.unit_price_fils,
      })),
    );
    if (itemsErr) return { ok: false, error: itemsErr.message };
  }

  const pieces = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.unit_price_fils, 0);

  // No separate "confirm payment" step: saving the price goes straight to
  // washing, which charges the customer's wallet (the DB trigger, debt allowed).
  const { error } = await supabase
    .from("orders")
    .update({
      piece_count: pieces,
      price_fils: total,
      delivery_date: deliveryDate,
      status: "washing",
    })
    .eq("id", orderId);
  if (error) {
    if (/INSUFFICIENT_CREDIT/.test(error.message)) return { ok: false, error: "insufficient_credit" };
    return { ok: false, error: error.message };
  }

  // Send the receipt (with the link) to the customer in the background.
  after(async () => {
    try {
      await sendReceiptFor(orderId);
    } catch {}
  });

  revalidate(orderId);
  return { ok: true };
}

// awaiting_payment -> washing: charge the wallet and start washing immediately,
// then send the customer their receipt in the BACKGROUND (via after()) so the
// WhatsApp send never blocks/hangs the confirm button.
export async function confirmPayment(orderId: string): Promise<Ok> {
  const res = await setStatus(orderId, "washing");
  if (!res.ok) return res;
  // Fire the receipt send after the response is returned — the wallet charge and
  // status change are already committed by setStatus above.
  after(async () => {
    try {
      await sendReceiptFor(orderId);
    } catch {
      // receipt can be re-sent later; never affects the payment
    }
  });
  revalidate(orderId);
  return res;
}

// washing -> ready: clothes are clean and ready for delivery / pickup.
// For a self-pickup order, tell the customer it's ready to collect.
export async function markReady(orderId: string, force = false): Promise<Ok> {
  const res = await setStatus(orderId, "ready", force);
  if (!res.ok) return res;
  after(async () => {
    try {
      const admin = createAdminClient();
      const { data: o } = await admin
        .from("orders")
        .select("order_no, customer_id, fulfillment")
        .eq("id", orderId)
        .single();
      if (o?.fulfillment === "self_pickup") {
        await notifyReadyForPickup(orderId, o.order_no, o.customer_id);
      }
    } catch {}
  });
  return res;
}

// Override the dispatch day for an assigned order — lets the shop decide which
// day the driver sees it (and makes the next-day flow testable: set it to today
// to show it now, or to an earlier day to mark it late). Staff only.
export async function setDispatchDate(orderId: string, date: string): Promise<Ok> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "bad_date" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ dispatch_date: date })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };
  revalidate(orderId);
  return { ok: true };
}

// ready -> delivered (self-pickup only): the customer collected the order at the
// shop. No delivery driver is involved. The debt gate at "ready" already ensured
// the wallet isn't negative before the order could reach this point. Confirm to
// the customer that their order has been picked up.
export async function markPickedUp(orderId: string): Promise<Ok> {
  const res = await setStatus(orderId, "delivered");
  if (!res.ok) return res;
  after(async () => {
    try {
      const admin = createAdminClient();
      const { data: o } = await admin
        .from("orders")
        .select("order_no, customer_id")
        .eq("id", orderId)
        .single();
      if (o) await notifyCollected(orderId, o.order_no, o.customer_id);
    } catch {}
  });
  return res;
}

// ready -> delivering: assign a delivery driver and choose the dispatch day.
// `date` (YYYY-MM-DD) is the day the driver should deliver; defaults to the next
// Kuwait day when the shop doesn't pick one.
export async function assignDeliveryDriver(
  orderId: string,
  driverId: string,
  date?: string,
  force = false,
): Promise<Ok> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  const dispatchDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : nextDispatchDate();
  const { data, error } = await supabase
    .from("orders")
    .update({
      delivery_driver_id: driverId,
      status: "delivering",
      dispatch_date: dispatchDate,
      // `force` = deliver despite the customer being in debt.
      ...(force ? { debt_override: true } : {}),
    })
    .eq("id", orderId)
    .select("order_no")
    .single();
  if (error) {
    if (/CUSTOMER_IN_DEBT/.test(error.message)) return { ok: false, error: "customer_in_debt" };
    return { ok: false, error: error.message };
  }
  after(async () => {
    try {
      await notifyReadyForDelivery(orderId, data.order_no, driverId);
    } catch {}
  });
  revalidate(orderId);
  return { ok: true };
}

// Cancel an order and refund it. If it was paid from the wallet, the amount is
// credited back to the wallet; a cash (walk-in) order is a cash refund at the
// counter (no wallet change). Orders that weren't paid yet refund nothing.
export async function cancelOrder(
  orderId: string,
  reason: string,
  refund: boolean,
): Promise<{ ok: true; refundFils: number; refundType: RefundType } | { ok: false; error: string }> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  const cleanReason = reason?.trim();
  if (!cleanReason) return { ok: false, error: "reason_required" };

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_no, status, price_fils, charged, customer_id")
    .eq("id", orderId)
    .single();
  if (!order) return { ok: false, error: "not_found" };
  if (order.status === "cancelled") return { ok: false, error: "already_cancelled" };

  const price = order.price_fils ?? 0;
  let refundFils = 0;
  let refundType: RefundType = "none";
  let newCharged = order.charged; // keep as-is unless we refund

  if (refund && order.charged && price > 0) {
    // Was this order charged to the wallet?
    const { data: charge } = await admin
      .from("credit_transactions")
      .select("id")
      .eq("order_id", orderId)
      .eq("type", "order_charge")
      .maybeSingle();

    if (charge) {
      // Paid from the wallet → refund to the wallet (idempotent per order).
      await admin.rpc("wallet_refund", {
        p_customer: order.customer_id,
        p_amount: price,
        p_order: orderId,
        p_note: `Refund for ${order.order_no}`,
      });
      refundType = "wallet";
    } else {
      // Paid in cash at the counter (walk-in) → cash refund, wallet untouched.
      refundType = "cash";
    }
    refundFils = price;
    newCharged = false; // refunded → drop from revenue
  }
  // If refund === false: keep the payment (charged stays true → still counts as
  // revenue), and refund nothing.

  const { error } = await admin
    .from("orders")
    .update({
      status: "cancelled",
      charged: newCharged,
      cancel_reason: cleanReason,
      refund_fils: refundFils || null,
    })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  revalidate(orderId);
  return { ok: true, refundFils, refundType };
}
