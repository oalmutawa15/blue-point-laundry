"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Persist the signed-in user's chosen language on their profile, so
// server-sent messages (like the receipt) can match the language they use on
// the website. No-op when signed out. Never throws.
export async function saveLangPreference(lang: string): Promise<void> {
  if (lang !== "ar" && lang !== "en") return;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const admin = createAdminClient();
    const { data: prof } = await admin
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single();
    const prefs =
      prof?.preferences && typeof prof.preferences === "object" && !Array.isArray(prof.preferences)
        ? (prof.preferences as Record<string, unknown>)
        : {};
    if (prefs.lang === lang) return; // already saved
    await admin.from("profiles").update({ preferences: { ...prefs, lang } }).eq("id", user.id);
  } catch {
    // preference is best-effort — never block the UI
  }
}
