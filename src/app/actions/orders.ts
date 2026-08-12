"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { notifyNewOrder } from "@/lib/notify";
import { PICKUP_CANCEL_WINDOW_MS } from "@/lib/pickup";

type Result = { ok: true; id: string } | { ok: false; error: string };

export async function createPickupRequest(
  addressId: string,
  note: string,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Prepaid gate: must have a positive wallet balance to place an order.
  const { data: prof } = await supabase
    .from("profiles")
    .select("credit_fils")
    .eq("id", user.id)
    .single();
  if (!prof || prof.credit_fils <= 0) {
    return { ok: false, error: "insufficient_credit" };
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      pickup_address_id: addressId,
      customer_note: note?.trim() || null,
      status: "new",
    })
    .select("id, order_no")
    .single();

  if (error) return { ok: false, error: error.message };

  // Alert shop staff on WhatsApp in the background so the button returns fast.
  after(async () => {
    try {
      await notifyNewOrder(data.id, data.order_no);
    } catch {}
  });

  revalidatePath("/home");
  revalidatePath("/orders");
  return { ok: true, id: data.id };
}

// Customer-initiated cancellation of their own pickup, allowed only within one
// hour of the request and only before the order has been collected/priced.
export async function cancelMyPickup(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, created_at, customer_id")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!order) return { ok: false, error: "not_found" };

  // Only a not-yet-collected pickup can be self-cancelled.
  if (!["new", "pickup_requested"].includes(order.status)) {
    return { ok: false, error: "too_late_status" };
  }
  // …and only within the 1-hour window from the request time.
  const age = Date.now() - new Date(order.created_at).getTime();
  if (age > PICKUP_CANCEL_WINDOW_MS) return { ok: false, error: "window_closed" };

  // Ownership + window are enforced above; use the admin client for the write so
  // it isn't blocked by the customer-update RLS policy.
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ status: "cancelled", cancel_reason: "Cancelled by customer" })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/home");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}
