import { NextRequest, NextResponse } from "next/server";
import { finalizeUpayments } from "@/lib/upayments";

export const dynamic = "force-dynamic";

// UPayments redirects the customer's browser here after payment. We try to
// finalize once (it's idempotent) and then hand off to the result screen, which
// polls until the payment is definitively approved or failed — so a capture that
// lands via the webhook a moment later still shows as "approved".
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment");
  if (!paymentId) return NextResponse.redirect(new URL("/credit", req.url));

  try {
    await finalizeUpayments(paymentId);
  } catch {
    // the result screen will keep polling regardless
  }

  return NextResponse.redirect(new URL(`/pay/result?payment=${paymentId}`, req.url));
}
