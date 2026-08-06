"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findPackage } from "@/lib/packages";

// Start a top-up for a prepaid package. Mirrors UPayments createCharge: creates a
// pending payment (charged = deposit, credit = deposit + bonus) and returns a
// checkout URL to redirect the customer to. (Mock = our own page.)
export async function createTopUp(
  depositFils: number,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const pkg = findPackage(depositFils);
  if (!pkg) return { ok: false, error: "invalid_package" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("payments")
    .insert({
      customer_id: user.id,
      amount_fils: pkg.deposit,
      credit_fils: pkg.credit,
      status: "pending",
      provider: "upayments_mock",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, url: `/pay/mock/${data.id}` };
}

// Simulates the UPayments callback/webhook: marks the payment paid or failed,
// and credits the wallet on success (via the service_role-only wallet_topup RPC).
export async function confirmMockPayment(
  paymentId: string,
  outcome: "success" | "fail",
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  // Only the owner can confirm, and only a still-pending payment.
  if (!payment || payment.customer_id !== user.id || payment.status !== "pending") {
    return { ok: false };
  }

  if (outcome === "fail") {
    await admin.from("payments").update({ status: "failed" }).eq("id", paymentId);
    return { ok: true };
  }

  await admin
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", paymentId);

  // Credit the wallet with the package amount (deposit + bonus), falling back to
  // the charged amount for any legacy payment without a credit amount.
  await admin.rpc("wallet_topup", {
    p_customer: payment.customer_id,
    p_amount: payment.credit_fils ?? payment.amount_fils,
    p_reference: payment.id,
    p_note: "UPayments top-up",
  });

  revalidatePath("/credit");
  return { ok: true };
}
