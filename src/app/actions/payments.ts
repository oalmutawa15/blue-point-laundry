"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findPackage } from "@/lib/packages";
import { emailForPhone } from "@/lib/auth";
import { upaymentsCreateCharge } from "@/lib/upayments";

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Start a real UPayments charge for a prepaid package and return the hosted
// payment page URL to redirect the customer to.
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

  const { data: prof } = await supabase
    .from("profiles")
    .select("phone, full_name")
    .eq("id", user.id)
    .single();

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      customer_id: user.id,
      amount_fils: pkg.deposit,
      credit_fils: pkg.credit,
      status: "pending",
      provider: "upayments",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const base = await siteOrigin();
  const charge = await upaymentsCreateCharge({
    amountKwd: pkg.deposit / 1000,
    paymentId: payment.id,
    customer: {
      id: user.id,
      name: prof?.full_name || "Blue Point Customer",
      email: emailForPhone(prof?.phone || "+96500000000"),
      mobile: (prof?.phone || "").replace(/\D/g, ""),
    },
    returnUrl: `${base}/pay/upayments/return?payment=${payment.id}`,
    cancelUrl: `${base}/credit?topup=failed`,
    notificationUrl: `${base}/api/upayments/webhook?payment=${payment.id}`,
  });

  const admin = createAdminClient();
  if (!charge.ok) {
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return { ok: false, error: charge.error };
  }
  await admin.from("payments").update({ provider_ref: charge.trackId }).eq("id", payment.id);
  return { ok: true, url: charge.link };
}
