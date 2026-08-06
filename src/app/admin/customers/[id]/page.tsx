import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerDetail } from "@/components/admin/CustomerDetail";

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("profiles")
    .select("id, full_name, phone, credit_fils")
    .eq("id", id)
    .single();
  if (!customer) notFound();

  const [ordersRes, txRes] = await Promise.all([
    supabase.from("orders").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    supabase
      .from("credit_transactions")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <CustomerDetail
      customer={customer}
      orders={ordersRes.data ?? []}
      transactions={txRes.data ?? []}
    />
  );
}
