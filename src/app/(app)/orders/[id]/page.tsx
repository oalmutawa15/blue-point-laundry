import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderDetail } from "@/components/customer/OrderDetail";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const [addressRes, itemsRes, eventsRes] = await Promise.all([
    order.pickup_address_id
      ? supabase.from("addresses").select("*").eq("id", order.pickup_address_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("order_events").select("*").eq("order_id", id),
  ]);

  return (
    <OrderDetail
      order={order}
      address={addressRes.data ?? null}
      items={itemsRes.data ?? []}
      events={eventsRes.data ?? []}
    />
  );
}
