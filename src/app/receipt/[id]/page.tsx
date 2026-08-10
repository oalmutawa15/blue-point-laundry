import { createAdminClient } from "@/lib/supabase/admin";
import { PublicReceipt, type ReceiptData } from "@/components/PublicReceipt";
import { ReceiptNotFound } from "@/components/ReceiptNotFound";

export const dynamic = "force-dynamic";

// Public, no-auth receipt — access is gated by the per-order receipt_token in
// the `t` query param, so only someone with the link (sent over WhatsApp) can
// open it.
export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t: token } = await searchParams;

  if (!token) return <ReceiptNotFound />;

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "order_no, status, created_at, piece_count, price_fils, receipt_token, customer:customer_id(full_name), items:order_items(service, garment, qty, unit_price_fils)",
    )
    .eq("id", id)
    .eq("receipt_token", token)
    .maybeSingle();

  if (!order) return <ReceiptNotFound />;

  const customerRel = order.customer as
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
  const customer = Array.isArray(customerRel) ? customerRel[0] : customerRel;
  const data: ReceiptData = {
    orderNo: order.order_no,
    status: order.status,
    createdAt: order.created_at,
    customerName: customer?.full_name ?? "",
    pieceCount: order.piece_count,
    priceFils: order.price_fils,
    items: (order.items ?? []) as ReceiptData["items"],
  };

  return <PublicReceipt data={data} />;
}
