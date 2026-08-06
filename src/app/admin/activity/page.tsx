import { createClient } from "@/lib/supabase/server";
import { ActivityList, type ActivityRow } from "@/components/admin/ActivityList";

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_log")
    .select("id, action, target, created_at, actor:actor_id(full_name, phone)")
    .order("created_at", { ascending: false })
    .limit(100);

  return <ActivityList rows={(data ?? []) as unknown as ActivityRow[]} />;
}
