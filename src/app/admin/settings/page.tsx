import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "cost_pct").single();
  return <SettingsForm costPct={Number(data?.value ?? 40)} />;
}
