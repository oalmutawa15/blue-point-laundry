import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RefundReceipt } from "@/components/shop/RefundReceipt";

export const dynamic = "force-dynamic";

export default async function RefundReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order } = await admin.from("orders").select("*").eq("id", id).single();
  if (!order) notFound();

  const [{ data: customer }, { data: items }, { data: refundTxn }] = await Promise.all([
    admin.from("profiles").select("full_name, phone").eq("id", order.customer_id).single(),
    admin.from("order_items").select("*").eq("order_id", id).order("created_at"),
    admin
      .from("credit_transactions")
      .select("id")
      .eq("order_id", id)
      .eq("type", "refund")
      .maybeSingle(),
  ]);

  const method: "wallet" | "cash" | "none" = refundTxn
    ? "wallet"
    : (order.refund_fils ?? 0) > 0
      ? "cash"
      : "none";

  return (
    <RefundReceipt
      order={order}
      customerName={customer?.full_name ?? null}
      customerPhone={customer?.phone ?? null}
      items={items ?? []}
      method={method}
    />
  );
}
