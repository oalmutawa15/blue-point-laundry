import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DriverOrderDetail } from "@/components/driver/DriverOrderDetail";

export default async function DriverOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  if (!order || !user) notFound();

  const [customerRes, addressRes] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", order.customer_id).single(),
    order.pickup_address_id
      ? supabase.from("addresses").select("*").eq("id", order.pickup_address_id).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <DriverOrderDetail
      order={order}
      customer={customerRes.data ?? null}
      address={addressRes.data ?? null}
      currentUserId={user.id}
    />
  );
}
