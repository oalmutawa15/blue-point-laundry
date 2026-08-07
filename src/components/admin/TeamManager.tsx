"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  addTeamMember,
  setMemberRole,
  removeMember,
  setMemberPassword,
} from "@/app/actions/admin";
import type { Tables, UserRole } from "@/types/database";

const ROLES: UserRole[] = ["shop", "driver", "admin"];

export function TeamManager({
  team,
  currentUserId,
}: {
  team: Pick<Tables<"profiles">, "id" | "full_name" | "phone" | "role">[];
  currentUserId: string;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState<UserRole>("driver");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    setBusy(true);
    const res = await addTeamMember(phone, name, role, pw);
    setBusy(false);
    if (!res.ok) {
      setError(
        res.error === "invalid_phone"
          ? t.login.invalidPhone
          : res.error === "weak_password"
            ? t.admin.team.weakPassword
            : res.error,
      );
      return;
    }
    setName("");
    setPhone("");
    setPw("");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{t.admin.team.title}</h1>

      {/* Add member */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <p className="mb-3 font-bold">{t.admin.team.add}</p>
        <div className="grid gap-3 sm:grid-cols-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.admin.team.name}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder={t.admin.team.phone}
            inputMode="numeric"
            dir="ltr"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder={t.login.password}
            type="text"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{t.admin.roles[r]}</option>
            ))}
          </select>
          <button
            onClick={add}
            disabled={busy || !name || phone.length < 8 || pw.length < 4}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
          >
            {busy ? t.common.loading : t.admin.team.addMember}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      {/* Team list */}
      <div className="divide-y divide-border rounded-2xl bg-card shadow-sm">
        {team.map((mDone) => (
          <div key={mDone.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{mDone.full_name || "—"}</p>
              <p dir="ltr" className="text-sm text-muted-foreground">{mDone.phone}</p>
            </div>
            <select
              value={mDone.role}
              onChange={async (e) => {
                await setMemberRole(mDone.id, e.target.value as UserRole);
                router.refresh();
              }}
              disabled={mDone.id === currentUserId}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{t.admin.roles[r]}</option>
              ))}
            </select>
            <button
              onClick={async () => {
                const np = prompt(t.admin.team.newPassword);
                if (!np) return;
                const res = await setMemberPassword(mDone.id, np);
                if (!res.ok) {
                  alert(res.error === "weak_password" ? t.admin.team.weakPassword : res.error);
                } else {
                  router.refresh();
                }
              }}
              className="text-sm font-semibold text-brand"
            >
              {t.admin.team.resetPassword}
            </button>
            {mDone.id !== currentUserId && (
              <button
                onClick={async () => {
                  if (!confirm(t.admin.team.confirmRemove)) return;
                  await removeMember(mDone.id);
                  router.refresh();
                }}
                className="text-sm font-semibold text-danger"
              >
                {t.admin.team.remove}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
