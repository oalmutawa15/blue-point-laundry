// Seeds Blue Point staff/driver accounts so they can log in via the phone-only flow.
// Run: node --env-file=.env.local scripts/seed-team.mjs
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEPPER = process.env.AUTH_PEPPER;
const DOMAIN = process.env.PHONE_EMAIL_DOMAIN || "phone.bluepoint.app";

if (!URL || !KEY || !PEPPER) {
  console.error("Missing env. Run with: node --env-file=.env.local scripts/seed-team.mjs");
  process.exit(1);
}

const admin = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const team = [
  { phone: "60000000", name: "المدير", role: "admin" },
  { phone: "60000001", name: "عامل المصبغة", role: "shop" },
  { phone: "51111111", name: "مندوب ١", role: "driver" },
  { phone: "52222222", name: "مندوب ٢", role: "driver" },
  { phone: "53333333", name: "مندوب ٣", role: "driver" },
];

for (const m of team) {
  const e164 = "+965" + m.phone;
  const email = `965${m.phone}@${DOMAIN}`;
  const password = createHmac("sha256", PEPPER).update(e164).digest("hex");
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { phone: e164, full_name: m.name, role: m.role },
  });
  console.log(error ? `skip ${m.phone} (${m.role}): ${error.message}` : `created ${m.phone} (${m.role}) — ${m.name}`);
}
console.log("Done.");
