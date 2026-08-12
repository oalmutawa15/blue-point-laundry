// Client-safe Kuwait-day helpers for the driver dispatch model. (Unlike
// src/lib/dispatch.ts these run in the browser too, for "Late" badges.)

// Today's Kuwait calendar date as YYYY-MM-DD (works in browser and on server).
export function kuwaitToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// A driver leg is "late" once its dispatch day has passed and the order is
// still pending (not yet picked up / delivered). YYYY-MM-DD strings compare
// chronologically, so a plain string compare is correct.
export function isLate(
  dispatchDate?: string | null,
  status?: string | null,
): boolean {
  if (!dispatchDate) return false;
  const pending = status === "pickup_requested" || status === "delivering";
  return pending && dispatchDate < kuwaitToday();
}
