"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffProfile } from "@/lib/auth";

export type PickupSchedule = {
  id: string;
  weekdays: number[];
  address_id: string | null;
  active: boolean;
};

// ---- Customer: their own weekly pickup schedule -------------------------------

// The signed-in customer's pickup schedule (one per customer), or null.
export async function getMyPickupSchedule(): Promise<PickupSchedule | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("recurring_schedules")
    .select("id, weekdays, address_id, active")
    .eq("customer_id", user.id)
    .eq("kind", "pickup")
    .maybeSingle();
  return (data as PickupSchedule) ?? null;
}

// Create/replace the customer's weekly pickup schedule. Empty weekdays turns it
// off. `addressId` defaults to the customer's default address.
export async function saveMyPickupSchedule(
  weekdays: number[],
  addressId?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const days = [...new Set(weekdays.filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);

  // Resolve the pickup address (explicit → given, else the default address).
  let address = addressId ?? null;
  if (!address) {
    const { data: def } = await supabase
      .from("addresses")
      .select("id")
      .eq("customer_id", user.id)
      .eq("is_default", true)
      .maybeSingle();
    address = def?.id ?? null;
  }

  const { data: existing } = await supabase
    .from("recurring_schedules")
    .select("id")
    .eq("customer_id", user.id)
    .eq("kind", "pickup")
    .maybeSingle();

  const active = days.length > 0;
  if (existing) {
    const { error } = await supabase
      .from("recurring_schedules")
      .update({ weekdays: days, address_id: address, active })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("recurring_schedules").insert({
      customer_id: user.id,
      kind: "pickup",
      weekdays: days,
      address_id: address,
      active,
      created_by: user.id,
    });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/schedule");
  revalidatePath("/home");
  return { ok: true };
}

// ---- Shop: recurring delivery schedules for chosen customers ------------------

export type DeliveryScheduleRow = {
  id: string;
  weekdays: number[];
  active: boolean;
  customer_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  driver_id: string | null;
  driver_name: string | null;
};

export type DriverOption = { id: string; full_name: string | null; phone: string };

// Drivers to assign a delivery schedule to.
export async function listDrivers(): Promise<DriverOption[]> {
  if (!(await getStaffProfile())) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, phone")
    .eq("role", "driver")
    .eq("is_active", true)
    .order("full_name");
  return (data ?? []) as DriverOption[];
}

// All delivery schedules with customer + driver names, for the shop UI.
export async function listDeliverySchedules(): Promise<DeliveryScheduleRow[]> {
  if (!(await getStaffProfile())) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("recurring_schedules")
    .select(
      "id, weekdays, active, customer_id, driver_id, customer:customer_id(full_name, phone), driver:driver_id(full_name)",
    )
    .eq("kind", "delivery")
    .order("created_at", { ascending: false });
  type Row = {
    id: string;
    weekdays: number[];
    active: boolean;
    customer_id: string;
    driver_id: string | null;
    customer: { full_name: string | null; phone: string } | { full_name: string | null; phone: string }[] | null;
    driver: { full_name: string | null } | { full_name: string | null }[] | null;
  };
  return ((data ?? []) as Row[]).map((r) => {
    const c = Array.isArray(r.customer) ? r.customer[0] : r.customer;
    const d = Array.isArray(r.driver) ? r.driver[0] : r.driver;
    return {
      id: r.id,
      weekdays: r.weekdays,
      active: r.active,
      customer_id: r.customer_id,
      customer_name: c?.full_name ?? null,
      customer_phone: c?.phone ?? null,
      driver_id: r.driver_id,
      driver_name: d?.full_name ?? null,
    };
  });
}

export async function createDeliverySchedule(input: {
  customerId: string;
  weekdays: number[];
  driverId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await getStaffProfile();
  if (!staff) return { ok: false, error: "forbidden" };
  const days = [...new Set(input.weekdays.filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);
  if (!input.customerId) return { ok: false, error: "no_customer" };
  if (days.length === 0) return { ok: false, error: "no_days" };
  if (!input.driverId) return { ok: false, error: "no_driver" };

  const admin = createAdminClient();
  const { error } = await admin.from("recurring_schedules").insert({
    customer_id: input.customerId,
    kind: "delivery",
    weekdays: days,
    driver_id: input.driverId,
    active: true,
    created_by: staff.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/shop/schedules");
  return { ok: true };
}

// Turn a delivery schedule on/off (staff).
export async function setDeliveryScheduleActive(
  id: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("recurring_schedules").update({ active }).eq("id", id).eq("kind", "delivery");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/shop/schedules");
  return { ok: true };
}

export async function deleteDeliverySchedule(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await getStaffProfile())) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("recurring_schedules").delete().eq("id", id).eq("kind", "delivery");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/shop/schedules");
  return { ok: true };
}
