import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DriverJobList } from "@/components/driver/DriverJobList";
import type { OrderWithRelations } from "@/lib/orderTypes";

const SELECT =
  "*, customer:customer_id(full_name, phone), pickup_address:pickup_address_id(*)";

export default async function DriverDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [pickupsRes, deliveriesRes] = await Promise.all([
    supabase
      .from("orders")
      .select(SELECT)
      .eq("pickup_driver_id", user.id)
      .eq("status", "pickup_requested")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(SELECT)
      .eq("delivery_driver_id", user.id)
      .eq("status", "delivering")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <DriverJobList
      pickups={(pickupsRes.data ?? []) as unknown as OrderWithRelations[]}
      deliveries={(deliveriesRes.data ?? []) as unknown as OrderWithRelations[]}
    />
  );
}
