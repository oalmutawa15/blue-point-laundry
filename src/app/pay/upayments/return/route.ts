import { NextRequest, NextResponse } from "next/server";
import { finalizeUpayments } from "@/lib/upayments";

// UPayments redirects the customer's browser here after payment.
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment");
  let ok = false;
  if (paymentId) {
    const result = await finalizeUpayments(paymentId);
    ok = result === "paid" || result === "already";
  }
  return NextResponse.redirect(
    new URL(`/credit?topup=${ok ? "success" : "failed"}`, req.url),
  );
}
