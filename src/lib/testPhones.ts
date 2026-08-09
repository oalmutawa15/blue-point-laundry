import "server-only";

// Numbers that get the OTP shown ON SCREEN instead of over WhatsApp (for offline
// testing). Empty by default now, so EVERY number receives a real WhatsApp OTP.
// Add specific numbers via the TEST_PHONES env var (comma-separated E.164) if you
// ever need on-screen codes again.
const DEFAULT_TEST_PHONES: string[] = [];

export function isTestPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const extra = (process.env.TEST_PHONES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_TEST_PHONES, ...extra]).has(phone);
}
