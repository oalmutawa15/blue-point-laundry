import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { roleHomePath } from "@/lib/roles";
import { ShopShell } from "@/components/shop/ShopShell";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/");
  if (profile.role !== "shop" && profile.role !== "admin") {
    redirect(roleHomePath(profile.role));
  }

  return <ShopShell>{children}</ShopShell>;
}
