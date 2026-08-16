// Replaces the test drivers with the real Blue Point drivers, ready to log in
// (phone + password). Deactivates the old placeholder drivers.
// Run: node --env-file=.env.local scripts/set-drivers.mjs
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEPPER = process.env.AUTH_PEPPER;
const DOMAIN = process.env.PHONE_EMAIL_DOMAIN || "phone.bluepoint.app";

if (!URL || !KEY || !PEPPER) {
  console.error("Missing env. Run with: node --env-file=.env.local scripts/set-drivers.mjs");
  process.exit(1);
}

const admin = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// The password every driver types on the login screen (phone + this password).
const LOGIN_PASSWORD = "driver2026";

const drivers = [
  { phone: "90903623", name: "Abbas / عباس" },
  { phone: "91110191", name: "Ranjit / رانجيت" },
  { phone: "98865895", name: "Hassan / حسن" },
  { phone: "99788752", name: "Mumtaz / ممتاز" },
];

// Old placeholder drivers to retire.
const retirePhones = ["+96551111111", "+96552222222", "+96553333333"];

for (const d of drivers) {
  const e164 = "+965" + d.phone;
  const email = `965${d.phone}@${DOMAIN}`;
  const phonePassword = createHmac("sha256", PEPPER).update(e164).digest("hex");

  // Create the auth user (ignore if it already exists).
  const created = await admin.auth.admin.createUser({
    email,
    password: phonePassword,
    email_confirm: true,
    user_metadata: { phone: e164, full_name: d.name, role: "driver" },
  });
  if (created.error && !/already|exists|registered/i.test(created.error.message)) {
    console.log(`error ${d.phone}: ${created.error.message}`);
    continue;
  }

  // Find the profile (created by the auth trigger) and normalise it.
  const { data: prof } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", e164)
    .maybeSingle();
  if (!prof?.id) {
    console.log(`no profile for ${d.phone}`);
    continue;
  }

  // Make sure the phone-login password matches (in case the user pre-existed).
  await admin.auth.admin.updateUserById(prof.id, {
    password: phonePassword,
    email_confirm: true,
    user_metadata: { phone: e164, full_name: d.name, role: "driver" },
  });

  await admin
    .from("profiles")
    .update({ role: "driver", full_name: d.name, is_active: true })
    .eq("id", prof.id);

  await admin.rpc("set_login_password", { p_user: prof.id, p_password: LOGIN_PASSWORD });

  console.log(`ready: ${d.name} — login ${d.phone} / ${LOGIN_PASSWORD}`);
}

// Retire the old placeholder drivers so they no longer appear in the picker.
const { error: retireErr } = await admin
  .from("profiles")
  .update({ is_active: false })
  .in("phone", retirePhones);
console.log(retireErr ? `retire error: ${retireErr.message}` : `retired ${retirePhones.length} old drivers`);

console.log("Done.");
