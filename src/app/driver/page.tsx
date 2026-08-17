import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DriverJobList } from "@/components/driver/DriverJobList";
import { kuwaitDate } from "@/lib/dispatch";
import type { OrderWithRelations } from "@/lib/orderTypes";

const SELECT =
  "*, customer:customer_id(full_name, phone), pickup_address:pickup_address_id(*)";

export default async function DriverDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Driver sees today's jobs plus a preview of tomorrow's batch (grouped
  // separately in the UI). Anything further out stays hidden. Legacy orders
  // with no dispatch_date are shown immediately.
  const tomorrow = kuwaitDate(1);
  const visible = `dispatch_date.is.null,dispatch_date.lte.${tomorrow}`;

  const [pickupsRes, deliveriesRes, inCarRes] = await Promise.all([
    supabase
      .from("orders")
      .select(SELECT)
      .eq("pickup_driver_id", user.id)
      .eq("status", "pickup_requested")
      .or(visible)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(SELECT)
      .eq("delivery_driver_id", user.id)
      .eq("status", "delivering")
      .or(visible)
      .order("created_at", { ascending: false }),
    // Collected from the customer, not yet received at the shop → "in the car".
    supabase
      .from("orders")
      .select(SELECT)
      .eq("pickup_driver_id", user.id)
      .eq("status", "picked_up")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <DriverJobList
      pickups={(pickupsRes.data ?? []) as unknown as OrderWithRelations[]}
      deliveries={(deliveriesRes.data ?? []) as unknown as OrderWithRelations[]}
      inCar={(inCarRes.data ?? []) as unknown as OrderWithRelations[]}
    />
  );
}
