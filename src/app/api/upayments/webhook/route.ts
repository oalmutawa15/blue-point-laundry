import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeUpayments } from "@/lib/upayments";
import { parsePaymentId } from "@/lib/paymentId";

export const dynamic = "force-dynamic";

// Server-to-server notification from UPayments (fires when a charge settles).
// UPayments does NOT sign its webhooks, so the body alone is NOT trusted to mean
// "paid" — anyone could POST `result=CAPTURED`. Instead the webhook only tells us
// WHICH payment to check; finalizeUpayments then INDEPENDENTLY asks UPayments'
// get-payment-status API and credits ONLY on a real capture. A customer who opens
// the link and leaves without paying is never captured, so nothing is credited.

type WebhookFields = {
  payment_id?: string;
  track_id?: string;
  order_id?: string;
  ref?: string;
  result?: string;
};

// UPayments may send JSON or form-encoded; read whichever and pull the ids.
async function readBody(req: NextRequest): Promise<WebhookFields> {
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      return (await req.json()) as WebhookFields;
    }
    const text = await req.text();
    if (!text) return {};
    // Try JSON first (some gateways mislabel the content-type), then form-encoding.
    try {
      return JSON.parse(text) as WebhookFields;
    } catch {
      const p = new URLSearchParams(text);
      return Object.fromEntries(p.entries()) as WebhookFields;
    }
  } catch {
    return {};
  }
}

// Resolve OUR payment id from the query param or, failing that, from the webhook
// body (track_id → provider_ref, or order_id/ref → the dashless payment id we set
// as the UPayments order reference).
async function resolvePaymentId(
  req: NextRequest,
  body: WebhookFields,
): Promise<string | null> {
  const fromQuery = parsePaymentId(req.nextUrl.searchParams.get("payment"));
  if (fromQuery) return fromQuery;

  const admin = createAdminClient();

  const trackId = body.track_id?.trim();
  if (trackId) {
    const { data } = await admin
      .from("payments")
      .select("id")
      .eq("provider_ref", trackId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  // We set the UPayments order reference to the payment id with dashes stripped.
  const ref = (body.order_id || body.ref || "").trim();
  if (ref) {
    const { data } = await admin.from("payments").select("id").limit(200);
    const match = (data ?? []).find((p) => p.id.replace(/-/g, "").slice(0, 35) === ref);
    if (match?.id) return match.id;
  }
  return null;
}

async function handle(req: NextRequest) {
  const fields: WebhookFields = req.method === "POST" ? await readBody(req) : {};
  const paymentId = await resolvePaymentId(req, fields);

  console.log(
    `[upayments webhook] result="${fields.result ?? ""}" track_id="${fields.track_id ?? ""}" order_id="${fields.order_id ?? ""}" → payment=${paymentId ?? "unresolved"}`,
  );

  if (!paymentId) {
    // Acknowledge so UPayments doesn't hammer retries, but we credited nothing.
    return NextResponse.json({ ok: true, verified: false });
  }

  // Independent verification with UPayments; credits only on a genuine capture.
  const state = await finalizeUpayments(paymentId).catch(() => "pending" as const);
  return NextResponse.json({ ok: true, state });
}

export async function POST(req: NextRequest) {
  return handle(req);
}
export async function GET(req: NextRequest) {
  return handle(req);
}
