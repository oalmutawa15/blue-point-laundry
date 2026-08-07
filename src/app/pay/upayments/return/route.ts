import { NextRequest, NextResponse } from "next/server";
import { finalizeUpayments } from "@/lib/upayments";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// UPayments redirects the customer's browser here after payment. Capture can lag
// the redirect by a second or two, so poll a few times before deciding — and only
// show "failed" on a definitive failure, never on a not-yet-settled payment.
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment");
  let outcome: "success" | "failed" | "pending" = "pending";

  if (paymentId) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const result = await finalizeUpayments(paymentId);
      if (result === "paid" || result === "already") {
        outcome = "success";
        break;
      }
      if (result === "failed") {
        outcome = "failed";
        break;
      }
      if (attempt < 3) await sleep(1200); // pending → give capture a moment, then retry
    }
  }

  return NextResponse.redirect(new URL(`/credit?topup=${outcome}`, req.url));
}
