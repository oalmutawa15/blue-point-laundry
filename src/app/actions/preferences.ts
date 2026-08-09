"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Preferences } from "@/lib/preferences";

export async function savePreferences(prefs: Preferences): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ preferences: prefs })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/preferences");
  return { ok: true };
}
