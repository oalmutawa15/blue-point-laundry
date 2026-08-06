import { createClient } from "@/lib/supabase/server";
import { ShopOrderList } from "@/components/shop/ShopOrderList";
import type { OrderWithRelations } from "@/lib/orderTypes";

export default async function ShopDashboard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "*, customer:customer_id(full_name, phone), pickup_address:pickup_address_id(*)",
    )
    .order("created_at", { ascending: false });

  return (
    <ShopOrderList orders={(data ?? []) as unknown as OrderWithRelations[]} />
  );
}
