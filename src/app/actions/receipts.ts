"use server";

import { revalidatePath } from "next/cache";
import { getStaffProfile } from "@/lib/auth";
import { sendReceiptFor } from "@/lib/receipt";

// Publish an order receipt: build its public link and send it to the customer
// over WhatsApp. Shop/admin only.
export async function publishReceipt(
  orderId: string,
): Promise<{ ok: true; url: string; phone: string | null } | { ok: false; error: string }> {
  if (!(await getStaffProfile())) return { ok: false, error: "unauthorized" };
  const res = await sendReceiptFor(orderId);
  if (res.ok) revalidatePath(`/shop/orders/${orderId}`);
  return res;
}
