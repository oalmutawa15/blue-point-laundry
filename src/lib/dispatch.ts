import "server-only";

// Driver dispatch runs on Kuwait calendar days (Asia/Kuwait, UTC+3, no DST).
// A driver's batch for a day runs 00:00–23:59 Kuwait time.

// Kuwait calendar date (YYYY-MM-DD) offset by `days` from today.
//   kuwaitDate(0) → today in Kuwait, kuwaitDate(1) → tomorrow.
export function kuwaitDate(days = 0): string {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The day an order becomes visible to the driver it's assigned to today: the
// NEXT Kuwait day. Used when the shop assigns a pickup/delivery driver.
export function nextDispatchDate(): string {
  return kuwaitDate(1);
}

// Today's weekday in Kuwait as a number: 0 = Sunday .. 6 = Saturday (matching
// JS getDay). Used to fire recurring weekly schedules on the right day.
export function kuwaitWeekday(): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuwait",
    weekday: "short",
  }).format(new Date());
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? 0;
}
