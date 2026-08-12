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

  // Next-day dispatch: a driver only sees orders whose dispatch day is today or
  // earlier (Kuwait time). Orders assigned today (dispatch = tomorrow) stay
  // hidden until 00:00; orders still pending from earlier days carry over.
  // Legacy orders with no dispatch_date are shown immediately.
  const today = kuwaitDate(0);
  const visible = `dispatch_date.is.null,dispatch_date.lte.${today}`;

  const [pickupsRes, deliveriesRes] = await Promise.all([
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
  ]);

  return (
    <DriverJobList
      pickups={(pickupsRes.data ?? []) as unknown as OrderWithRelations[]}
      deliveries={(deliveriesRes.data ?? []) as unknown as OrderWithRelations[]}
    />
  );
}
