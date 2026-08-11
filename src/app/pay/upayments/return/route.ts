import { NextRequest, NextResponse } from "next/server";
import { finalizeUpayments } from "@/lib/upayments";

export const dynamic = "force-dynamic";

// UPayments redirects the customer's browser here after payment. We redirect to
// the result screen IMMEDIATELY (no blocking on UPayments), so the customer
// always lands on our branded "confirming" screen within a moment instead of
// staring at a blank loading page while a slow gateway call resolves. The result
// screen then fast-polls /api/payment-status (which finalizes idempotently) and
// resolves to approved/failed within seconds.
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment");
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

  return NextResponse.redirect(new URL(`/pay/result?payment=${paymentId}`, req.url));
}
