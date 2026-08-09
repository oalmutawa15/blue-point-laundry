"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailForPhone, passwordForPhone } from "@/lib/auth";
import { normalizeKwPhone } from "@/lib/phone";
import type { ItemInput } from "./shop";

export type CustomerHit = { id: string; full_name: string | null; phone: string };

// Search existing customers by name or phone (for the walk-in order builder).
export async function searchCustomers(query: string): Promise<CustomerHit[]> {
  const q = query.replace(/[,()%*]/g, " ").trim();
  if (q.length < 2) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, phone")
    .eq("role", "customer")
    .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(10);
  return (data ?? []) as CustomerHit[];
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
  note?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
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

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      customer_id: cust.id,
      pickup_address_id: null,
      status: "washing",
      charged: true, // paid at the counter
      piece_count: pieces,
      price_fils: total,
      delivery_date: input.deliveryDate ?? null,
      staff_note: input.note?.trim() || null,
    })
    .select("id")
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

  revalidatePath("/shop");
  return { ok: true, id: order.id };
}
