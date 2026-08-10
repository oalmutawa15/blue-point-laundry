import "server-only";
import { cache } from "react";
import { createHmac } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

const DOMAIN = process.env.PHONE_EMAIL_DOMAIN || "phone.bluepoint.app";

// Phone-only accounts are backed by a synthetic email + a password derived
// deterministically from the phone number (server secret). No mail is sent.
export function emailForPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  return `${digits}@${DOMAIN}`;
}

export function passwordForPhone(e164: string): string {
  const pepper = process.env.AUTH_PEPPER;
  if (!pepper) throw new Error("AUTH_PEPPER is not set");
  return createHmac("sha256", pepper).update(e164).digest("hex");
}

export type Profile = Tables<"profiles">;

// Current signed-in user's profile, or null.
// Wrapped in React cache() so repeated calls within the SAME request (e.g. a
// layout and its page both need the profile) share one auth + one profile
// query instead of repeating them. Scope is a single request — no cross-request
// or cross-user leakage, and the returned value is identical to before.
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
});
