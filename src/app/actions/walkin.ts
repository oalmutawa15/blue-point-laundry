"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailForPhone, passwordForPhone, getStaffProfile } from "@/lib/auth";
import { normalizeKwPhone } from "@/lib/phone";
import { sendReceiptFor } from "@/lib/receipt";
import { notifyPaymentLink } from "@/lib/notify";
import type { ItemInput } from "./shop";

// How a walk-in order is paid. Cash/KNET/card are settled at the counter; wallet
// deducts from the customer's website balance (debt allowed); link sends the
// customer an online payment link and leaves the order unpaid until they pay.
export type WalkInPayment = "cash" | "knet" | "credit_card" | "wallet" | "link";

import type { Json } from "@/types/database";

export type CustomerHit = {
  id: string;
  full_name: string | null;
  phone: string;
  preferences?: Json;
};

// Search existing customers by name or phone (for the walk-in order builder).
// Staff only — this reads across all customers via the service-role client.
export async function searchCustomers(query: string): Promise<CustomerHit[]> {
  if (!(await getStaffProfile())) return [];
  const q = query.replace(/[,()%*]/g, " ").trim();
  if (q.length < 2) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, phone, preferences")
    .eq("role", "customer")
    .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(10);
  return (data ?? []) as CustomerHit[];
}

// Look up a customer by exact phone (for the walk-in builder's auto-detect).
// Returns the match or null. Staff only.
export async function findCustomerByPhone(phone: string): Promise<CustomerHit | null> {
  if (!(await getStaffProfile())) return null;
  const norm = normalizeKwPhone(phone);
  if (!norm) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, phone, preferences")
    .eq("phone", norm.e164)
    .eq("role", "customer")
    .maybeSingle();
  return (data as CustomerHit) ?? null;
}

async function findOrCreateCustomer(input: {
  customerId?: string;
  name?: string;
  phone?: string;
}): Promise<{ id: string } | { error: string }> {
  const admin = createAdminClient();
  if (input.customerId) return { id: input.customerId };

  const norm = normalizeKwPhone(input.phone ?? "");
  if (!norm) return { error: "invalid_phone" };

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", norm.e164)
    .maybeSingle();
  if (existing) {
    if (input.name) await admin.from("profiles").update({ full_name: input.name }).eq("id", existing.id);
    return { id: existing.id };
  }

  const created = await admin.auth.admin.createUser({
    email: emailForPhone(norm.e164),
    password: passwordForPhone(norm.e164),
    email_confirm: true,
    user_metadata: { phone: norm.e164, full_name: input.name ?? null, role: "customer" },
  });
  if (created.error && !/already|exists|registered/i.test(created.error.message)) {
    return { error: created.error.message };
  }
  const { data: prof } = await admin.from("profiles").select("id").eq("phone", norm.e164).single();
  if (!prof?.id) return { error: "create_failed" };
  if (input.name) await admin.from("profiles").update({ full_name: input.name }).eq("id", prof.id);
  return { id: prof.id };
}

// Create an in-store (walk-in) order: items are counted & priced at the counter and
// paid on the spot, so it starts at "washing" and is flagged as already charged.
export async function createWalkInOrder(input: {
  customerId?: string;
  newCustomer?: { name: string; phone: string };
  items: ItemInput[];
  deliveryDate?: string | null;
  fulfillment?: "delivery" | "self_pickup";
  paymentMethod?: WalkInPayment;
  note?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  if (!input.items.length) return { ok: false, error: "no_items" };

  const cust = await findOrCreateCustomer({
    customerId: input.customerId,
    name: input.newCustomer?.name,
    phone: input.newCustomer?.phone,
  });
  if ("error" in cust) return { ok: false, error: cust.error };

  const admin = createAdminClient();
  const pieces = input.items.reduce((s, i) => s + i.qty, 0);
  const total = input.items.reduce((s, i) => s + i.qty * i.unit_price_fils, 0);
  const method: WalkInPayment = input.paymentMethod ?? "cash";
  // "link" is paid later online → the order is not settled yet. Every other
  // method (cash/KNET/card/wallet) settles the order now.
  const charged = method !== "link";

  // Apply the customer's permanent discount (if any).
  const { data: prof } = await admin
    .from("profiles")
    .select("discount_percent")
    .eq("id", cust.id)
    .single();
  const discount = prof?.discount_percent ?? 0;
  const priced = discount > 0 ? Math.round((total * (100 - discount)) / 100) : total;

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      customer_id: cust.id,
      pickup_address_id: null,
      status: "washing",
      charged,
      payment_method: method,
      piece_count: pieces,
      price_fils: priced,
      discount_percent: discount,
      delivery_date: input.deliveryDate ?? null,
      fulfillment: input.fulfillment === "self_pickup" ? "self_pickup" : "delivery",
      staff_note: input.note?.trim() || null,
    })
    .select("id, order_no, receipt_token")
    .single();
  if (error) return { ok: false, error: error.message };

  const { error: itemsErr } = await admin.from("order_items").insert(
    input.items.map((i) => ({
      order_id: order.id,
      service: i.service,
      garment: i.garment || null,
      qty: i.qty,
      unit_price_fils: i.unit_price_fils,
    })),
  );
  if (itemsErr) return { ok: false, error: itemsErr.message };

  // "Credit in the website" → deduct the total from the customer's wallet now
  // (debt allowed, mirroring the washing-charge trigger for online orders).
  if (method === "wallet" && priced > 0) {
    await admin.from("credit_transactions").insert({
      customer_id: cust.id,
      amount_fils: -priced,
      type: "order_charge",
      order_id: order.id,
      note: `Order ${order.order_no}`,
    });
    const { data: wp } = await admin
      .from("profiles")
      .select("credit_fils")
      .eq("id", cust.id)
      .single();
    await admin
      .from("profiles")
      .update({ credit_fils: (wp?.credit_fils ?? 0) - priced })
      .eq("id", cust.id);
  }

  // The site origin — used to build the online payment link for "link" orders.
  const origin = await (async () => {
    const h = await headers();
    const host = h.get("host") ?? "";
    const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return host ? `${proto}://${host}` : "";
  })();

  // The receipt is "published" the moment a walk-in order is created → send the
  // customer their receipt link over WhatsApp (in the background). When paid by
  // link, also send a secure per-order payment link (amount fixed server-side).
  after(async () => {
    try {
      await sendReceiptFor(order.id);
      if (method === "link" && origin) {
        const payUrl = `${origin}/pay/order/${order.id}?t=${order.receipt_token}`;
        await notifyPaymentLink(order.id, order.order_no, cust.id, payUrl, priced);
      }
    } catch {}
  });

  revalidatePath("/shop");
  return { ok: true, id: order.id };
}
