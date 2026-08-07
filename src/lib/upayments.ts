import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// UPayments gateway. Sandbox works out of the box with the public test token.
// Go live by setting UPAYMENTS_API_URL + UPAYMENTS_TOKEN to production values.
const BASE = process.env.UPAYMENTS_API_URL || "https://sandboxapi.upayments.com/api/v1";
const TOKEN = process.env.UPAYMENTS_TOKEN || "jtest123";

export type CreateChargeInput = {
  amountKwd: number;
  paymentId: string;
  customer: { id: string; name: string; email: string; mobile: string };
  returnUrl: string;
  cancelUrl: string;
  notificationUrl: string;
};

export async function upaymentsCreateCharge(
  input: CreateChargeInput,
): Promise<{ ok: true; link: string; trackId: string | null } | { ok: false; error: string }> {
  // UPayments caps these id fields at 35 chars — use the 32-char dashless UUID.
  const shortId = input.paymentId.replace(/-/g, "").slice(0, 35);
  const body = {
    products: [
      {
        name: "Blue Point wallet top-up",
        description: "Wallet balance top-up",
        price: input.amountKwd,
        quantity: 1,
      },
    ],
    order: {
      id: shortId,
      reference: shortId,
      description: "Wallet top-up",
      currency: "KWD",
      amount: input.amountKwd,
    },
    language: "en",
    reference: { id: shortId },
    customer: {
      uniqueId: input.customer.id,
      name: input.customer.name,
      email: input.customer.email,
      mobile: input.customer.mobile,
    },
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    notificationUrl: input.notificationUrl,
  };

  try {
    const res = await fetch(`${BASE}/charge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      status?: boolean;
      message?: string;
      data?: { link?: string; trackId?: string; track_id?: string };
    };
    if (!res.ok || !json.status) {
      console.error(
        `[upayments charge failed] base=${BASE} http=${res.status} resp=${JSON.stringify(json)}`,
      );
      return { ok: false, error: json.message || `http_${res.status}` };
    }
    const link = json.data?.link;
    if (!link) return { ok: false, error: "no_link" };
    // The hosted link carries a session_id; fall back to that when no trackId is returned.
    let trackId = json.data?.trackId ?? json.data?.track_id ?? null;
    if (!trackId) {
      const m = link.match(/[?&]session_id=([^&]+)/);
      if (m) trackId = decodeURIComponent(m[1]);
    }
    return { ok: true, link, trackId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

type PaymentState = "paid" | "failed" | "pending";

// Ask UPayments for the real transaction state. Crucially this distinguishes a
// *definitive* failure from "not captured yet" — capture often lags the browser
// redirect by a second or two, and treating that gap as a failure was showing
// customers "Payment failed" while the webhook credited them moments later.
async function upaymentsPaymentState(idOrSession: string): Promise<PaymentState> {
  const urls = [
    `${BASE}/get-payment-status/${encodeURIComponent(idOrSession)}`,
    `${BASE}/get-payment-status?session_id=${encodeURIComponent(idOrSession)}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { transaction?: { result?: string; status?: string } };
      };
      const tx = json.data?.transaction;
      if (!tx) continue;
      const result = (tx.result ?? "").toUpperCase();
      const status = (tx.status ?? "").toLowerCase();

      if (result === "CAPTURED" || ["success", "done", "captured", "paid"].includes(status)) {
        return "paid";
      }
      if (
        result.startsWith("NOT") ||
        result.includes("FAIL") ||
        result.includes("DECLIN") ||
        ["failed", "declined", "canceled", "cancelled", "error", "expired"].includes(status)
      ) {
        return "failed";
      }
      return "pending";
    } catch {
      // try next form
    }
  }
  return "pending";
}

// Idempotently finalize a payment: verify with UPayments, then credit the wallet
// once. Crediting is idempotent at the DB level (unique reference), so it is safe
// for the browser-return and the webhook to both call this for the same payment.
export async function finalizeUpayments(
  paymentId: string,
): Promise<"paid" | "failed" | "already" | "pending"> {
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();
  if (!payment) return "failed";
  if (payment.status === "paid") return "already";
  // No provider reference yet → nothing to verify; leave it pending.
  if (!payment.provider_ref) return "pending";

  let state: PaymentState = "pending";
  try {
    state = await upaymentsPaymentState(payment.provider_ref);
  } catch {
    state = "pending";
  }

  if (state === "paid") {
    await admin
      .from("payments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", paymentId);
    await admin.rpc("wallet_topup", {
      p_customer: payment.customer_id,
      p_amount: payment.credit_fils ?? payment.amount_fils,
      p_reference: payment.id,
      p_note: "UPayments top-up",
    });
    return "paid";
  }
  if (state === "failed") {
    await admin.from("payments").update({ status: "failed" }).eq("id", paymentId);
    return "failed";
  }
  // Still processing — don't mark it failed; the webhook (or a retry) will settle it.
  return "pending";
}
