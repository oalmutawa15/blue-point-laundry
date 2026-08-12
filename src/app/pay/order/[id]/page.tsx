import { createAdminClient } from "@/lib/supabase/admin";
import { ReceiptNotFound } from "@/components/ReceiptNotFound";
import { OrderPayView } from "@/components/customer/OrderPayView";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export const dynamic = "force-dynamic";

// Public, no-auth order payment page. Access is gated by the per-order
// receipt_token in `t`. The amount comes from the order's own price_fils on the
// server — never from the URL — so the customer cannot change what they pay.
export default async function OrderPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; failed?: string; lang?: string }>;
}) {
  const { id } = await params;
  const { t: token, failed, lang } = await searchParams;
  const initialLang = lang === "en" ? "en" : "ar";

  if (!token) return <ReceiptNotFound />;

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_no, price_fils, charged, receipt_token, customer:customer_id(preferences)")
    .eq("id", id)
    .maybeSingle();

  if (!order || order.receipt_token !== token) return <ReceiptNotFound />;

  // Honor the customer's saved language when no explicit ?lang was given.
  type CustomerRel = { preferences: unknown };
  const rel = order.customer as CustomerRel | CustomerRel[] | null;
  const cust = Array.isArray(rel) ? rel[0] : rel;
  const prefs = cust?.preferences;
  const savedLang =
    prefs && typeof prefs === "object" && !Array.isArray(prefs) &&
    (prefs as Record<string, unknown>).lang === "en"
      ? "en"
      : "ar";
  const startLang = lang ? initialLang : savedLang;

  return (
    <LanguageProvider initialLang={startLang}>
      <OrderPayView
        orderId={order.id}
        orderNo={order.order_no}
        amountFils={order.price_fils ?? 0}
        token={token}
        paid={order.charged}
        failed={failed === "1"}
      />
    </LanguageProvider>
  );
}
