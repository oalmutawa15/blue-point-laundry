import { ShopCustomers } from "@/components/shop/ShopCustomers";
import { listShopCustomers } from "@/app/actions/customers";

export const dynamic = "force-dynamic";

export default async function ShopCustomersPage() {
  const customers = await listShopCustomers();
  return <ShopCustomers customers={customers} />;
}
