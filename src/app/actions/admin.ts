"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile, emailForPhone, passwordForPhone } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeKwPhone } from "@/lib/phone";
import type { UserRole } from "@/types/database";

type Ok = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const p = await getSessionProfile();
  if (!p || p.role !== "admin") throw new Error("forbidden");
  return p;
}

type Admin = ReturnType<typeof createAdminClient>;
async function log(admin: Admin, actorId: string, action: string, target: string, meta?: unknown) {
  await admin.from("activity_log").insert({ actor_id: actorId, action, target, meta: meta ?? null });
}

export async function addTeamMember(
  phone: string,
  name: string,
  role: UserRole,
): Promise<Ok> {
  const me = await requireAdmin();
  const norm = normalizeKwPhone(phone);
  if (!norm) return { ok: false, error: "invalid_phone" };
  if (!["shop", "driver", "admin"].includes(role)) return { ok: false, error: "bad_role" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: emailForPhone(norm.e164),
    password: passwordForPhone(norm.e164),
    email_confirm: true,
    user_metadata: { phone: norm.e164, full_name: name, role },
  });
  if (error) {
    if (!/already|exists|registered/i.test(error.message)) {
      return { ok: false, error: error.message };
    }
    // Existing account → promote/rename it.
    await admin.from("profiles").update({ role, full_name: name }).eq("phone", norm.e164);
  }
  await log(admin, me.id, "add_member", norm.e164, { role, name });
  revalidatePath("/admin/team");
  return { ok: true };
}

export async function setMemberRole(userId: string, role: UserRole): Promise<Ok> {
  const me = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  await log(admin, me.id, "set_role", userId, { role });
  revalidatePath("/admin/team");
  return { ok: true };
}

export async function removeMember(userId: string): Promise<Ok> {
  const me = await requireAdmin();
  if (userId === me.id) return { ok: false, error: "cannot_remove_self" };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };
  await log(admin, me.id, "remove_member", userId);
  revalidatePath("/admin/team");
  return { ok: true };
}

export async function adjustWallet(
  customerId: string,
  amountFils: number,
  note: string,
): Promise<Ok> {
  const me = await requireAdmin();
  if (!Number.isFinite(amountFils) || amountFils === 0) return { ok: false, error: "invalid_amount" };
  const admin = createAdminClient();
  const { error } = await admin.rpc("wallet_adjust", {
    p_customer: customerId,
    p_amount: Math.round(amountFils),
    p_note: note || "Admin adjustment",
  });
  if (error) return { ok: false, error: error.message };
  await log(admin, me.id, "wallet_adjust", customerId, { amountFils, note });
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function updateCostPct(pct: number): Promise<Ok> {
  const me = await requireAdmin();
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return { ok: false, error: "invalid" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("settings")
    .update({ value: pct, updated_at: new Date().toISOString() })
    .eq("key", "cost_pct");
  if (error) return { ok: false, error: error.message };
  await log(admin, me.id, "update_setting", "cost_pct", { pct });
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true };
}
