import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kuwaitDate } from "@/lib/dispatch";
import { notifyLateOrders } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Runs once a day just after midnight (Kuwait) via Vercel Cron. Finds every
// order still pending past its dispatch day and alerts the shop + admin.
// Protected by CRON_SECRET: Vercel automatically sends it as a Bearer token on
// cron invocations when the env var is set.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = kuwaitDate(0);
  const { data: late, error } = await admin
    .from("orders")
    .select("id, order_no")
    .lt("dispatch_date", today)
    .in("status", ["pickup_requested", "delivering"]);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const res = await notifyLateOrders(late ?? []);
  return NextResponse.json({ ok: true, late: late?.length ?? 0, notified: res.notified });
}
