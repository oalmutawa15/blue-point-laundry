"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/whatsapp";
import { isTestPhone } from "@/lib/testPhones";

export type AddressInput = {
  label?: string;
  area: string;
  block?: string;
  street?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  extra_directions?: string;
  lat?: number;
  lng?: number;
};

// Send an OTP to add/change an address. Real numbers get the code by WhatsApp;
// the seeded test/demo numbers keep the on-screen code so the app stays testable
// without a live messaging channel.
export async function requestAddressOtp(): Promise<
  { ok: true; devCode?: string; sent?: boolean } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: prof } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .single();
  const phone = prof?.phone ?? null;

  const code = String(randomInt(1000, 10000));
  const admin = createAdminClient();
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { error } = await admin
    .from("otp_codes")
    .insert({ customer_id: user.id, code, purpose: "address", expires_at });
  if (error) return { ok: false, error: error.message };

  // Test/demo numbers: keep the code on screen, don't message a real phone.
  if (isTestPhone(phone)) {
    return { ok: true, devCode: code };
  }

  // Real customer → send the code to their WhatsApp. Never leak it to the client.
  if (!phone) return { ok: false, error: "no_phone" };
  const body =
    `Blue Point — address verification code: ${code}\n` +
    `مصبغة بلو بوينت — رمز تأكيد العنوان: ${code}\n` +
    `(valid 5 min / صالح ٥ دقائق)`;
  const wa = await sendWhatsApp(phone, body);
  if (!wa.ok) return { ok: false, error: "otp_send_failed" };
  return { ok: true, sent: true };
}

export async function addAddress(
  input: AddressInput,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const admin = createAdminClient();
  const { data: otps } = await admin
    .from("otp_codes")
    .select("*")
    .eq("customer_id", user.id)
    .eq("purpose", "address")
    .is("consumed_at", null)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  const otp = otps?.[0];
  if (!otp || otp.code !== code.trim()) return { ok: false, error: "otp_invalid" };
  await admin
    .from("otp_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", otp.id);

  const [{ data: existing }, { data: prof }] = await Promise.all([
    supabase.from("addresses").select("id").limit(1),
    supabase.from("profiles").select("phone").eq("id", user.id).single(),
  ]);
  const isFirst = (existing?.length ?? 0) === 0;

  const { error } = await supabase.from("addresses").insert({
    customer_id: user.id,
    label: input.label?.trim() || null,
    area: input.area.trim(),
    block: input.block?.trim() || null,
    street: input.street?.trim() || null,
    building: input.building?.trim() || null,
    floor: input.floor?.trim() || null,
    apartment: input.apartment?.trim() || null,
    extra_directions: input.extra_directions?.trim() || null,
    // Contact number is always the signed-in customer's own phone.
    contact_phone: prof?.phone ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    is_default: isFirst,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/addresses");
  revalidatePath("/home");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase.from("addresses").update({ is_default: false }).eq("customer_id", user.id);
  await supabase.from("addresses").update({ is_default: true }).eq("id", id);
  revalidatePath("/addresses");
  revalidatePath("/home");
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", id);
  revalidatePath("/addresses");
  revalidatePath("/home");
  return { ok: true };
}
