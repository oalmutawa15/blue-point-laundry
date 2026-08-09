import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { OrdersView } from "@/components/customer/OrdersView";

export default async function OrdersPage() {
  const supabase = await createClient();
  const profile = await getSessionProfile();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return <OrdersView orders={data ?? []} creditFils={profile?.credit_fils ?? 0} />;
}
