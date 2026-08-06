import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { roleHomePath } from "@/lib/roles";
import { CustomerShell } from "@/components/customer/CustomerShell";

// Guards all customer routes: must be signed in as a customer.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/");
  if (profile.role !== "customer") redirect(roleHomePath(profile.role));

  return <CustomerShell creditFils={profile.credit_fils}>{children}</CustomerShell>;
}
