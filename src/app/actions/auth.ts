"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailForPhone, passwordForPhone } from "@/lib/auth";
import { normalizeIntlPhone } from "@/lib/phone";
import { roleHomePath } from "@/lib/roles";
import type { UserRole } from "@/types/database";

type Result = { ok: true; redirect: string } | { ok: false; error: string };

// Phone-only sign-in: no password or OTP for the user. We look up (or create)
// the account behind the scenes and establish a real Supabase session.
export async function signInWithPhone(
  phoneInput: string,
  loginPassword?: string,
): Promise<Result> {
  const norm = normalizeIntlPhone(phoneInput);
  if (!norm) return { ok: false, error: "invalid_phone" };

  const admin = createAdminClient();

  // Staff/admin/driver accounts require a password; customers don't.
  const { data: check } = await admin.rpc("check_staff_login", {
    p_phone: norm.e164,
    p_password: loginPassword ?? "",
  });
  const gate = Array.isArray(check) ? check[0] : check;
  if (gate?.needs_password && !gate.password_ok) {
    return { ok: false, error: loginPassword ? "wrong_password" : "password_required" };
  }

  const email = emailForPhone(norm.e164);
  const password = passwordForPhone(norm.e164);
  const supabase = await createClient();

  // Existing account → sign in directly.
  let signIn = await supabase.auth.signInWithPassword({ email, password });

  if (signIn.error) {
    // New account → create it (admin), then sign in.
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

// Lightweight check used by the login screen: does this number belong to a
// staff/admin/driver account (which needs a password)? Customers → false, so
// the password field only appears for the three staff roles.
export async function phoneNeedsPassword(phoneInput: string): Promise<boolean> {
  const norm = normalizeIntlPhone(phoneInput);
  if (!norm) return false;
  const admin = createAdminClient();
  const { data: check } = await admin.rpc("check_staff_login", {
    p_phone: norm.e164,
    p_password: "",
  });
  const gate = Array.isArray(check) ? check[0] : check;
  return Boolean(gate?.needs_password);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
