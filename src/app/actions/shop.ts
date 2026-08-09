"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyPickupAssigned, notifyReadyForDelivery } from "@/lib/notify";
import type { Database } from "@/types/database";

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
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) {
    if (/INSUFFICIENT_CREDIT/.test(error.message)) return { ok: false, error: "insufficient_credit" };
    return { ok: false, error: error.message };
  }
  revalidate(orderId);
  return { ok: true };
}

// new -> pickup_requested: assign a driver to pick up from the customer.
export async function assignPickupDriver(orderId: string, driverId: string): Promise<Ok> {
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

// awaiting_payment -> washing: confirm payment (charges the wallet) and start washing.
export async function confirmPayment(orderId: string): Promise<Ok> {
  return setStatus(orderId, "washing");
}

// washing -> ready: clothes are clean and ready for delivery.
export async function markReady(orderId: string): Promise<Ok> {
  return setStatus(orderId, "ready");
}

// ready -> delivering: assign a delivery driver and dispatch.
export async function assignDeliveryDriver(orderId: string, driverId: string): Promise<Ok> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ delivery_driver_id: driverId, status: "delivering" })
    .eq("id", orderId)
    .select("order_no")
    .single();
  if (error) return { ok: false, error: error.message };
  await notifyReadyForDelivery(orderId, data.order_no, driverId);
  revalidate(orderId);
  return { ok: true };
}
