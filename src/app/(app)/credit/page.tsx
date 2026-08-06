import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { CreditView } from "@/components/customer/CreditView";

export default async function CreditPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string }>;
}) {
  const { topup } = await searchParams;
  const supabase = await createClient();
  const profile = await getSessionProfile();
  const { data: txns } = await supabase
    .from("credit_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const topupStatus =
    topup === "success" ? "success" : topup === "failed" ? "failed" : null;

  return (
    <CreditView
      balanceFils={profile?.credit_fils ?? 0}
      transactions={txns ?? []}
      topupStatus={topupStatus}
    />
  );
}
