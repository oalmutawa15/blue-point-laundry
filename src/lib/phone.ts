// Kuwait phone helpers (safe on client and server).

export type NormalizedPhone = { e164: string; national: string };

// Accepts 8 local digits, or with 965 / 00965 / +965 prefixes.
export function normalizeKwPhone(input: string): NormalizedPhone | null {
  let n = (input || "").replace(/\D/g, "");
  if (n.startsWith("00965")) n = n.slice(5);
  else if (n.startsWith("965") && n.length > 8) n = n.slice(3);
  if (!/^[569]\d{7}$/.test(n)) return null;
  return { e164: `+965${n}`, national: n };
}

export const isValidKwPhone = (v: string) =>
  /^[569]\d{7}$/.test((v || "").replace(/\D/g, ""));

// Combine a country dial code with a locally-typed number into an E.164 number.
// Kuwait keeps its strict 8-digit rule; other countries accept 6–12 local digits.
export function normalizePhone(localInput: string, dial: string): NormalizedPhone | null {
  const d = (dial || "965").replace(/\D/g, "");
  let n = (localInput || "").replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (d && n.startsWith(d) && n.length > d.length) n = n.slice(d.length);
  if (d === "965") {
    if (!/^[569]\d{7}$/.test(n)) return null;
  } else if (!/^\d{6,12}$/.test(n)) {
    return null;
  }
  return { e164: `+${d}${n}`, national: n };
}

export const isValidPhone = (localInput: string, dial: string) =>
  normalizePhone(localInput, dial) !== null;

// Server-side: accept an already-built international number (with or without +)
// and produce a stable E.164 string.
export function normalizeIntlPhone(input: string): NormalizedPhone | null {
  let n = (input || "").replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (n.length < 7 || n.length > 15) return null;
  return { e164: `+${n}`, national: n };
}
