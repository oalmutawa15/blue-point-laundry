"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyDelivered } from "@/lib/notify";

type Ok = { ok: true } | { ok: false; error: string };

function revalidate(orderId: string) {
  revalidatePath("/driver");
  revalidatePath(`/driver/orders/${orderId}`);
  revalidatePath("/shop");
  revalidatePath(`/orders/${orderId}`);
}

// Driver collected the clothes from the customer.
export async function markPickedUp(orderId: string): Promise<Ok> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("orders")
    .update({ status: "picked_up" })
    .eq("id", orderId)
    .eq("pickup_driver_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidate(orderId);
  return { ok: true };
}

// Driver delivered the clothes back to the customer → order completed (wallet charged).
export async function markDelivered(orderId: string): Promise<Ok> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId)
    .eq("delivery_driver_id", user.id)
    .select("order_no, customer_id")
    .single();
  if (error) {
    if (/INSUFFICIENT_CREDIT/.test(error.message)) {
      return { ok: false, error: "insufficient_credit" };
    }
    return { ok: false, error: error.message };
  }

  await notifyDelivered(orderId, data.order_no, data.customer_id);
  revalidate(orderId);
  return { ok: true };
}
