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

  // Kick off finalize but DON'T await it — never let it delay the redirect.
  try {
    void finalizeUpayments(paymentId).catch(() => {});
  } catch {
    // ignore — the result screen polls regardless
  }

  return NextResponse.redirect(new URL(`/pay/result?payment=${paymentId}`, req.url));
}
