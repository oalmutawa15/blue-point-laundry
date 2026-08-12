"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailForPhone } from "@/lib/auth";
import { upaymentsCreateCharge } from "@/lib/upayments";

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Start a real UPayments charge for a SPECIFIC order and return the hosted payment
// page URL. Access is gated by the order's receipt_token (the same token in the
// link we WhatsApp the customer) — no login required. Crucially, the amount is
// read from the order's own price_fils on the server; it is never taken from the
// caller, so the customer cannot alter the price via the link.
export async function startOrderPayment(
  orderId: string,
  token: string,
): Promise<
  | { ok: true; url: string }
  | { ok: true; alreadyPaid: true }
  | { ok: false; error: string }
> {
  if (!orderId || !token) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_no, customer_id, receipt_token, price_fils, charged")
    .eq("id", orderId)
    .maybeSingle();

  // Token must match the order's receipt_token — this is the access gate.
  if (!order || order.receipt_token !== token) return { ok: false, error: "not_found" };
  if (order.charged) return { ok: true, alreadyPaid: true };

  const amountFils = order.price_fils ?? 0;
  if (amountFils <= 0) return { ok: false, error: "no_amount" };

  // Record a pending, order-scoped payment. amount_fils is the ORDER's price.
  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      customer_id: order.customer_id,
      order_id: order.id,
      kind: "order",
      amount_fils: amountFils,
      credit_fils: 0,
      status: "pending",
      provider: "upayments",
    })
    .select("id")
    .single();
  if (error || !payment) return { ok: false, error: error?.message ?? "create_failed" };

  const { data: prof } = await admin
    .from("profiles")
    .select("phone, full_name")
    .eq("id", order.customer_id)
    .single();

  const base = await siteOrigin();
  const charge = await upaymentsCreateCharge({
    amountKwd: amountFils / 1000,
    paymentId: payment.id,
    customer: {
      id: order.customer_id,
      name: prof?.full_name || "Blue Point Customer",
      email: emailForPhone(prof?.phone || "+96500000000"),
      mobile: (prof?.phone || "").replace(/\D/g, ""),
    },
    returnUrl: `${base}/pay/upayments/return?payment=${payment.id}`,
    cancelUrl: `${base}/pay/order/${order.id}?t=${token}&failed=1`,
    notificationUrl: `${base}/api/upayments/webhook?payment=${payment.id}`,
  });

  if (!charge.ok) {
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return { ok: false, error: charge.error };
  }
  await admin.from("payments").update({ provider_ref: charge.trackId }).eq("id", payment.id);
  return { ok: true, url: charge.link };
}
