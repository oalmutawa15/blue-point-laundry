import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { HomeView } from "@/components/customer/HomeView";

export default async function HomePage() {
  const supabase = await createClient();
  const profile = await getSessionProfile();

  const [addressesRes, activeRes] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*")
      .not("status", "in", "(completed,cancelled)")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  return (
    <HomeView
      addresses={addressesRes.data ?? []}
      activeOrder={activeRes.data?.[0] ?? null}
      creditFils={profile?.credit_fils ?? 0}
    />
  );
}
