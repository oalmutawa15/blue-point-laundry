import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeUpayments } from "@/lib/upayments";
import { parsePaymentId } from "@/lib/paymentId";

export const dynamic = "force-dynamic";

// Never let a browser/CDN cache a transient "pending" and replay it as the final
// answer — every poll must hit the live record.
const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
} as const;

// Polled by the payment-result screen. Finalizes (idempotently) and returns the
// authoritative payment-record status, so a slightly-late webhook capture shows
// as "approved" rather than a stale "failed".
export async function GET(req: NextRequest) {
  const paymentId = parsePaymentId(req.nextUrl.searchParams.get("payment"));
  if (!paymentId)
    return NextResponse.json({ status: "failed", amountFils: 0 }, { headers: NO_STORE });

  try {
    await finalizeUpayments(paymentId);
  } catch {
    // ignore — we still read the record below
  }

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("status, credit_fils, amount_fils")
    .eq("id", paymentId)
    .single();

  const status =
    payment?.status === "paid" ? "paid" : payment?.status === "failed" ? "failed" : "pending";
  const amountFils = payment?.credit_fils ?? payment?.amount_fils ?? 0;
  return NextResponse.json({ status, amountFils }, { headers: NO_STORE });
}
