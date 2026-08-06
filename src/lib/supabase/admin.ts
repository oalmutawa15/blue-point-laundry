import { createClient } from "@supabase/supabase-js";

// Server-only admin client (service_role). Bypasses RLS — never import into client code.
// Used for phone-only auth (create user) and payment confirmation (credit wallet).
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (Dashboard > Project Settings > API).",
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
