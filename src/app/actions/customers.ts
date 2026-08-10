"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getStaffProfile, emailForPhone, passwordForPhone } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeKwPhone } from "@/lib/phone";

export type ShopCustomer = {
  id: string;
  full_name: string | null;
  phone: string;
  credit_fils: number;
  orders_count: number;
  last_order_at: string | null;
  pending_fils: number;
};

// Aggregated customer list for the shop Customers page. Staff only.
export async function listShopCustomers(): Promise<ShopCustomer[]> {
  if (!(await getStaffProfile())) return [];
  const admin = createAdminClient();
  const { data } = await admin.rpc("shop_customer_list" as never);
  return (data ?? []) as unknown as ShopCustomer[];
}

// Add credit to a customer's wallet (shop top-up). Staff only.
export async function addCustomerCredit(
  customerId: string,
  amountKwd: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  const fils = Math.round((Number(amountKwd) || 0) * 1000);
  if (fils <= 0) return { ok: false, error: "invalid_amount" };
  const admin = createAdminClient();
  const { error } = await admin.rpc("wallet_topup", {
    p_customer: customerId,
    p_amount: fils,
    p_reference: `shop-${randomUUID()}`,
    p_note: "Shop credit",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/shop/customers/${customerId}`);
  return { ok: true };
}

// Add a new customer (name + phone). Staff only. Idempotent on phone.
export async function createCustomer(
  name: string,
  phone: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  const norm = normalizeKwPhone(phone);
  if (!norm) return { ok: false, error: "invalid_phone" };
  const cleanName = name.trim();

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", norm.e164)
    .maybeSingle();
  if (existing) {
    if (cleanName) await admin.from("profiles").update({ full_name: cleanName }).eq("id", existing.id);
    revalidatePath("/shop/customers");
    return { ok: true, id: existing.id };
  }

  const created = await admin.auth.admin.createUser({
    email: emailForPhone(norm.e164),
    password: passwordForPhone(norm.e164),
    email_confirm: true,
    user_metadata: { phone: norm.e164, full_name: cleanName || null, role: "customer" },
  });
  if (created.error && !/already|exists|registered/i.test(created.error.message)) {
    return { ok: false, error: created.error.message };
  }
  const { data: prof } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", norm.e164)
    .single();
  if (!prof?.id) return { ok: false, error: "create_failed" };
  if (cleanName) await admin.from("profiles").update({ full_name: cleanName }).eq("id", prof.id);

  revalidatePath("/shop/customers");
  return { ok: true, id: prof.id };
}
