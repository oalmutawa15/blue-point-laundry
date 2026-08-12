import { NextRequest, NextResponse } from "next/server";
import { finalizeUpayments } from "@/lib/upayments";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePaymentId } from "@/lib/paymentId";

export const dynamic = "force-dynamic";

// UPayments redirects the customer's browser here after payment. We redirect to
// the result screen IMMEDIATELY (no blocking on UPayments), so the customer
// always lands on our branded "confirming" screen within a moment instead of
// staring at a blank loading page while a slow gateway call resolves. The result
// screen then fast-polls /api/payment-status (which finalizes idempotently) and
// resolves to approved/failed within seconds.
export async function GET(req: NextRequest) {
  // Sanitize: UPayments may append `?payment_id=...`, corrupting our value.
  const paymentId = parsePaymentId(req.nextUrl.searchParams.get("payment"));
  if (!paymentId) return NextResponse.redirect(new URL("/credit", req.url));

  // Give the payment a short head start to settle BEFORE the result screen loads,
  // so the customer usually lands on a definite "confirmed"/"rejected" instead of
  // a spinner. Capped so a slow gateway can never freeze the redirect — if it's
  // not settled in time, the result screen keeps polling.
  try {
    await Promise.race([
      finalizeUpayments(paymentId).catch(() => {}),
      new Promise((r) => setTimeout(r, 6000)),
    ]);
  } catch {
    // ignore — the result screen polls regardless
  }

  // Route to the right result screen: an order-payment link lands on the order
  // result page; a wallet top-up lands on the wallet result page.
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("order_id")
    .eq("id", paymentId)
    .maybeSingle();
  const dest = payment?.order_id
    ? `/pay/order/${payment.order_id}/result?payment=${paymentId}`
    : `/pay/result?payment=${paymentId}`;
  return NextResponse.redirect(new URL(dest, req.url));
}
