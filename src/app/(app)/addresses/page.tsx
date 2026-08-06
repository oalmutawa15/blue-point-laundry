import { createClient } from "@/lib/supabase/server";
import { AddressManager } from "@/components/customer/AddressManager";

export default async function AddressesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return <AddressManager addresses={data ?? []} />;
}
