// Money is stored as integer fils. 1 KWD = 1000 fils.

export function filsToKwd(fils: number): string {
  return (fils / 1000).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

// KWD input (e.g. "2.5") -> fils integer.
export function kwdToFils(kwd: number | string): number {
  const n = typeof kwd === "string" ? parseFloat(kwd) : kwd;
  if (!isFinite(n)) return 0;
  return Math.round(n * 1000);
}

// Formatted amount with currency word for the active language.
export function formatMoney(fils: number, lang: "ar" | "en"): string {
  const amount = filsToKwd(Math.abs(fils));
  const sign = fils < 0 ? "-" : "";
  const cur = lang === "ar" ? "د.ك" : "KWD";
  return lang === "ar" ? `${sign}${amount} ${cur}` : `${sign}${cur} ${amount}`;
}
