// UPayments appends its own `?payment_id=...` to our return URL, and because our
// URL already carries `?payment=<uuid>`, the browser ends up with a corrupted
// value like `<uuid>?payment_id=<theirs>`. Our payment id is always the leading
// UUID, so extract exactly that and ignore anything appended.
const UUID_RE = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

export function parsePaymentId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(UUID_RE);
  return m ? m[0] : null;
}
