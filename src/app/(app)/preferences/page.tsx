import { getSessionProfile } from "@/lib/auth";
import { PreferencesView } from "@/components/customer/PreferencesView";
import type { Preferences } from "@/lib/preferences";

export default async function PreferencesPage() {
  const profile = await getSessionProfile();
  const initial = (profile?.preferences ?? {}) as Preferences;
  return <PreferencesView initial={initial} />;
}
