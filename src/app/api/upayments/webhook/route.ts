import { NextRequest, NextResponse } from "next/server";
import { finalizeUpayments } from "@/lib/upayments";

// Server-to-server notification from UPayments (backup to the browser return).
async function handle(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment");
  if (paymentId) await finalizeUpayments(paymentId);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  return handle(req);
}
export async function GET(req: NextRequest) {
  return handle(req);
}
