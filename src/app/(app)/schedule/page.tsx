import { createClient } from "@/lib/supabase/server";
import { getMyPickupSchedule } from "@/app/actions/schedules";
import { PickupScheduleView } from "@/components/customer/PickupScheduleView";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const supabase = await createClient();
  const [{ data: addresses }, schedule] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
    getMyPickupSchedule(),
  ]);

  return <PickupScheduleView schedule={schedule} addresses={addresses ?? []} />;
}
