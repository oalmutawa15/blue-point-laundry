import { NextRequest, NextResponse } from "next/server";
import { finalizeUpayments } from "@/lib/upayments";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// UPayments redirects the customer's browser here after payment. Captures are
// often ready at (or within a few seconds of) the redirect, so we briefly retry
// finalize server-side — if it settles here, the result screen loads already
// "approved" with no spinner at all. If it's still not captured after this short
// window we hand off anyway, and the result screen keeps polling.
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment");
  if (!paymentId) return NextResponse.redirect(new URL("/credit", req.url));

  for (let i = 0; i < 6; i++) {
    try {
      const state = await finalizeUpayments(paymentId);
      if (state === "paid" || state === "already" || state === "failed") break;
    } catch {
      // keep trying within the window
    }
    if (i < 5) await sleep(1500); // up to ~7.5s total
  }

  return NextResponse.redirect(new URL(`/pay/result?payment=${paymentId}`, req.url));
}
