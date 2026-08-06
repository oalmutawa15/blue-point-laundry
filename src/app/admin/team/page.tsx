import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { TeamManager } from "@/components/admin/TeamManager";

export default async function TeamPage() {
  const supabase = await createClient();
  const me = await getSessionProfile();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .in("role", ["shop", "driver", "admin"])
    .order("role");

  return <TeamManager team={data ?? []} currentUserId={me!.id} />;
}
