"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyPickupAssigned, notifyReadyForDelivery } from "@/lib/notify";

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

// Assign a driver to pick up from the customer.
export async function assignPickupDriver(
  orderId: string,
  driverId: string,
): Promise<Ok> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ pickup_driver_id: driverId, status: "pickup_assigned" })
    .eq("id", orderId)
    .select("order_no")
    .single();
  if (error) return { ok: false, error: error.message };
  await notifyPickupAssigned(orderId, data.order_no, driverId);
  revalidate(orderId);
  return { ok: true };
}

// Sign in the clothes: record items, price and delivery date, then send to the customer.
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
      status: "priced",
    })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  revalidate(orderId);
  return { ok: true };
}

// Mark the order as being cleaned.
export async function startProcessing(orderId: string): Promise<Ok> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "processing" })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };
  revalidate(orderId);
  return { ok: true };
}

// Clothes are ready → assign a delivery driver and dispatch.
export async function assignDeliveryDriver(
  orderId: string,
  driverId: string,
): Promise<Ok> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ delivery_driver_id: driverId, status: "out_for_delivery" })
    .eq("id", orderId)
    .select("order_no")
    .single();
  if (error) return { ok: false, error: error.message };
  await notifyReadyForDelivery(orderId, data.order_no, driverId);
  revalidate(orderId);
  return { ok: true };
}
