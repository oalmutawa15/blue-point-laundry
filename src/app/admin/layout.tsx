import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { roleHomePath } from "@/lib/roles";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/");
  if (profile.role !== "admin") redirect(roleHomePath(profile.role));

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
