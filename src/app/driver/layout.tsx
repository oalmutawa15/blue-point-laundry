import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { roleHomePath } from "@/lib/roles";
import { StaffTopBar } from "@/components/StaffTopBar";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/");
  if (profile.role !== "driver" && profile.role !== "admin") {
    redirect(roleHomePath(profile.role));
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background shadow-xl">
      <StaffTopBar area="driver" home="/driver" />
      <main className="px-4 py-5">{children}</main>
    </div>
  );
}
