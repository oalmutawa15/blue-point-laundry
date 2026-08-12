import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReceiptNotFound } from "@/components/ReceiptNotFound";
import { OrderPaymentResult } from "@/components/customer/OrderPaymentResult";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { parsePaymentId } from "@/lib/paymentId";

export const dynamic = "force-dynamic";

// Result screen for a per-order payment link. Reached after UPayments redirects
// back through /pay/upayments/return. Polls the payment status and shows a clear
// accepted / rejected / still-confirming result for THIS order.
export default async function OrderPayResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string; lang?: string }>;
}) {
  const { id } = await params;
  const { payment, lang } = await searchParams;
  const paymentId = parsePaymentId(payment);
  if (!paymentId) redirect("/home");

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_no, receipt_token, customer:customer_id(preferences)")
    .eq("id", id)
    .maybeSingle();
  if (!order) return <ReceiptNotFound />;

  type CustomerRel = { preferences: unknown };
  const rel = order.customer as CustomerRel | CustomerRel[] | null;
  const cust = Array.isArray(rel) ? rel[0] : rel;
  const prefs = cust?.preferences;
  const savedLang =
    prefs && typeof prefs === "object" && !Array.isArray(prefs) &&
    (prefs as Record<string, unknown>).lang === "en"
      ? "en"
      : "ar";
  const initialLang = lang === "en" ? "en" : lang === "ar" ? "ar" : savedLang;

  return (
    <LanguageProvider initialLang={initialLang}>
      <OrderPaymentResult
        paymentId={paymentId}
        orderId={order.id}
        orderNo={order.order_no}
        token={order.receipt_token}
      />
    </LanguageProvider>
  );
}
