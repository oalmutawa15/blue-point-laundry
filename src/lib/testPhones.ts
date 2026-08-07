import "server-only";

// Seeded demo/staff accounts. These keep the old "show the code on screen" flow
// so the app is testable without a live WhatsApp channel. Everyone else gets a
// real OTP sent to their phone. Extend via the TEST_PHONES env var (comma-separated
// E.164 numbers) without touching code.
const DEFAULT_TEST_PHONES = [
  "+96551234567",
  "+96596596604",
  "+96596604502",
  "+96560000000", // admin
  "+96560000001", // shop
  "+96551111111", // driver 1
  "+96552222222", // driver 2
  "+96553333333", // driver 3
];

export function isTestPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const extra = (process.env.TEST_PHONES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_TEST_PHONES, ...extra]).has(phone);
}
