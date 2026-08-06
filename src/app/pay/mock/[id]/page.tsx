import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MockCheckout } from "@/components/MockCheckout";

export default async function MockPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  if (!payment) notFound();

  return (
    <MockCheckout
      paymentId={payment.id}
      amountFils={payment.amount_fils}
      creditFils={payment.credit_fils ?? payment.amount_fils}
    />
  );
}
