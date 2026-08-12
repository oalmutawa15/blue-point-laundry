import { redirect } from "next/navigation";
import { PaymentResult } from "@/components/customer/PaymentResult";
import { parsePaymentId } from "@/lib/paymentId";

export const dynamic = "force-dynamic";

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment } = await searchParams;
  const paymentId = parsePaymentId(payment);
  if (!paymentId) redirect("/credit");
  return <PaymentResult paymentId={paymentId} />;
}
