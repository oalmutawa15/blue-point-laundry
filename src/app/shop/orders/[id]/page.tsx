import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShopOrderDetail } from "@/components/shop/ShopOrderDetail";
import type { DriverLite } from "@/lib/orderTypes";

export default async function ShopOrderPage({
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

  const [customerRes, addressRes, itemsRes, eventsRes, driversRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", order.customer_id)
        .single(),
      order.pickup_address_id
        ? supabase.from("addresses").select("*").eq("id", order.pickup_address_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("order_items").select("*").eq("order_id", id),
      supabase.from("order_events").select("*").eq("order_id", id),
      supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("role", "driver")
        .eq("is_active", true),
    ]);

  return (
    <ShopOrderDetail
      order={order}
      customer={customerRes.data ?? null}
      address={addressRes.data ?? null}
      items={itemsRes.data ?? []}
      events={eventsRes.data ?? []}
      drivers={(driversRes.data ?? []) as DriverLite[]}
    />
  );
}
