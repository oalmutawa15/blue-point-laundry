"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailForPhone, passwordForPhone } from "@/lib/auth";
import { normalizeKwPhone } from "@/lib/phone";
import { roleHomePath } from "@/lib/roles";
import type { UserRole } from "@/types/database";

type Result = { ok: true; redirect: string } | { ok: false; error: string };

// Phone-only sign-in: no password or OTP for the user. We look up (or create)
// the account behind the scenes and establish a real Supabase session.
export async function signInWithPhone(phoneInput: string): Promise<Result> {
  const norm = normalizeKwPhone(phoneInput);
  if (!norm) return { ok: false, error: "invalid_phone" };

  const email = emailForPhone(norm.e164);
  const password = passwordForPhone(norm.e164);
  const supabase = await createClient();

  // Existing account → sign in directly.
  let signIn = await supabase.auth.signInWithPassword({ email, password });

  if (signIn.error) {
    // New account → create it (admin), then sign in.
    const admin = createAdminClient();
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phone: norm.e164, role: "customer" },
    });
    if (created.error && !/already|registered|exists/i.test(created.error.message)) {
      return { ok: false, error: created.error.message };
    }
    signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error) return { ok: false, error: signIn.error.message };
  }

  // Route by role.
  const userId = signIn.data.user?.id;
  let role: UserRole = "customer";
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (profile?.role) role = profile.role;
  }
  return { ok: true, redirect: roleHomePath(role) };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
