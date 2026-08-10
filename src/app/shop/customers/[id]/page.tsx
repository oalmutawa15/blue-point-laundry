import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffProfile } from "@/lib/auth";
import { CustomerOrders } from "@/components/shop/CustomerOrders";
import type { Tables } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getStaffProfile())) notFound();
  const { id } = await params;

  const admin = createAdminClient();
  const [{ data: customer }, { data: orders }] = await Promise.all([
    admin.from("profiles").select("id, full_name, phone, credit_fils").eq("id", id).eq("role", "customer").single(),
    admin
      .from("orders")
      .select("id, order_no, status, price_fils, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!customer) notFound();

  return (
    <div className="space-y-4">
      <Link href="/shop/customers" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
        <svg className="h-5 w-5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </Link>
      <CustomerOrders
        customer={customer as Pick<Tables<"profiles">, "id" | "full_name" | "phone" | "credit_fils">}
        orders={(orders ?? []) as Pick<Tables<"orders">, "id" | "order_no" | "status" | "price_fils" | "created_at">[]}
      />
    </div>
  );
}
