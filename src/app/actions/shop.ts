"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffProfile } from "@/lib/auth";
import { notifyPickupAssigned, notifyReadyForDelivery } from "@/lib/notify";
import { sendReceiptFor } from "@/lib/receipt";
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

async function setStatus(orderId: string, status: OrderStatus): Promise<Ok> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
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
  const { data, error } = await supabase
    .from("orders")
    .update({ pickup_driver_id: driverId, status: "pickup_requested" })
    .eq("id", orderId)
    .select("order_no")
    .single();
  if (error) return { ok: false, error: error.message };
  await notifyPickupAssigned(orderId, data.order_no, driverId);
  revalidate(orderId);
  return { ok: true };
}

// picked_up -> counting: clothes received at the shop, ready to be counted.
export async function markReceived(orderId: string): Promise<Ok> {
  return setStatus(orderId, "counting");
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

  const { error } = await supabase
    .from("orders")
    .update({
      piece_count: pieces,
      price_fils: total,
      delivery_date: deliveryDate,
      status: "awaiting_payment",
    })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

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
export async function markReady(orderId: string): Promise<Ok> {
  return setStatus(orderId, "ready");
}

// ready -> delivered (self-pickup only): the customer collected the order at the
// shop. No delivery driver is involved. The debt gate at "ready" already ensured
// the wallet isn't negative before the order could reach this point.
export async function markPickedUp(orderId: string): Promise<Ok> {
  return setStatus(orderId, "delivered");
}

// ready -> delivering: assign a delivery driver and dispatch.
export async function assignDeliveryDriver(orderId: string, driverId: string): Promise<Ok> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ delivery_driver_id: driverId, status: "delivering" })
    .eq("id", orderId)
    .select("order_no")
    .single();
  if (error) {
    if (/CUSTOMER_IN_DEBT/.test(error.message)) return { ok: false, error: "customer_in_debt" };
    return { ok: false, error: error.message };
  }
  await notifyReadyForDelivery(orderId, data.order_no, driverId);
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
