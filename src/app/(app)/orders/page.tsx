import { createClient } from "@/lib/supabase/server";
import { OrdersView } from "@/components/customer/OrdersView";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return <OrdersView orders={data ?? []} />;
}
