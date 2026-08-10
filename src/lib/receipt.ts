import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyReceipt } from "@/lib/notify";

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Build an order's public receipt link and send it to the customer over
// WhatsApp, stamping receipt_sent_at. Callers must authorize (staff-only).
export async function sendReceiptFor(
  orderId: string,
): Promise<{ ok: true; url: string; phone: string | null } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_no, customer_id, receipt_token")
    .eq("id", orderId)
    .single();
  if (!order) return { ok: false, error: "not_found" };

  const origin = await siteOrigin();
  const url = `${origin}/receipt/${order.id}?t=${order.receipt_token}`;
  const res = await notifyReceipt(order.id, order.order_no, order.customer_id, url);
  if (!res.ok) return { ok: false, error: res.error };

  await admin
    .from("orders")
    .update({ receipt_sent_at: new Date().toISOString() })
    .eq("id", orderId);
  return { ok: true, url, phone: res.phone };
}
