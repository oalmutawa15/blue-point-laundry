import { listDeliverySchedules, listDrivers } from "@/app/actions/schedules";
import { ShopDeliverySchedules } from "@/components/shop/ShopDeliverySchedules";

export const dynamic = "force-dynamic";

export default async function ShopSchedulesPage() {
  const [schedules, drivers] = await Promise.all([listDeliverySchedules(), listDrivers()]);
  return <ShopDeliverySchedules schedules={schedules} drivers={drivers} />;
}
