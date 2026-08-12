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

  // Merge over the existing preferences so unrelated keys (e.g. the saved UI
  // language) aren't wiped.
  const { data: prof } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .single();
  const existing =
    prof?.preferences && typeof prof.preferences === "object" && !Array.isArray(prof.preferences)
      ? (prof.preferences as Record<string, unknown>)
      : {};

  const { error } = await supabase
    .from("profiles")
    .update({ preferences: { ...existing, ...prefs } })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/preferences");
  return { ok: true };
}
