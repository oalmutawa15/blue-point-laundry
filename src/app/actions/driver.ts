"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDelivered, notifyCustomerStage, notifyDeliveryPhoto } from "@/lib/notify";

type Ok = { ok: true } | { ok: false; error: string };

function revalidate(orderId: string) {
  revalidatePath("/driver");
  revalidatePath(`/driver/orders/${orderId}`);
  revalidatePath("/shop");
  revalidatePath(`/orders/${orderId}`);
}

// pickup_requested -> picked_up: driver collected the clothes from the customer.
export async function markPickedUp(orderId: string): Promise<Ok> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "picked_up" })
    .eq("id", orderId)
    .eq("pickup_driver_id", user.id)
    .select("order_no, customer_id")
    .single();
  if (error) return { ok: false, error: error.message };
  await notifyCustomerStage(orderId, data.order_no, data.customer_id, "picked_up");
  revalidate(orderId);
  return { ok: true };
}

// Upload a delivery-proof photo (data URL) to storage and return its public URL.
async function uploadDeliveryPhoto(orderId: string, dataUrl: string): Promise<string | null> {
  const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const contentType = m[1];
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const bytes = Buffer.from(m[2], "base64");
  const admin = createAdminClient();
  const path = `${orderId}/${randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("delivery-photos").upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) return null;
  return admin.storage.from("delivery-photos").getPublicUrl(path).data.publicUrl;
}

// delivering -> delivered: driver delivered the clothes, with a proof photo.
export async function markDelivered(orderId: string, photoDataUrl?: string): Promise<Ok> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  let photoUrl: string | null = null;
  if (photoDataUrl) {
    photoUrl = await uploadDeliveryPhoto(orderId, photoDataUrl);
    if (!photoUrl) return { ok: false, error: "photo_upload_failed" };
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "delivered", ...(photoUrl ? { delivery_photo_url: photoUrl } : {}) })
    .eq("id", orderId)
    .eq("delivery_driver_id", user.id)
    .select("order_no, customer_id")
    .single();
  if (error) {
    if (/INSUFFICIENT_CREDIT/.test(error.message)) return { ok: false, error: "insufficient_credit" };
    return { ok: false, error: error.message };
  }

  // Send the delivery-proof photo to the customer AND the shop. If for some
  // reason there's no photo, fall back to the plain "delivered" text.
  if (photoUrl) {
    await notifyDeliveryPhoto(orderId, data.order_no, data.customer_id, photoUrl);
  } else {
    await notifyDelivered(orderId, data.order_no, data.customer_id);
  }
  revalidate(orderId);
  return { ok: true };
}
