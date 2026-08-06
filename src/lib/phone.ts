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
