import { createClient } from "@/lib/supabase/server";
import { CustomersList } from "@/components/admin/CustomersList";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, credit_fils")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  return <CustomersList customers={data ?? []} />;
}
