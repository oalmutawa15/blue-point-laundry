"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyNewOrder } from "@/lib/notify";

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

  // Alert shop staff on WhatsApp (mock for now).
  await notifyNewOrder(data.id, data.order_no);

  revalidatePath("/home");
  revalidatePath("/orders");
  return { ok: true, id: data.id };
}
