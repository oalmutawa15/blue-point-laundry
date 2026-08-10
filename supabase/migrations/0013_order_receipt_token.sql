-- Public receipt link support: a hard-to-guess token per order (so a customer
-- can open their receipt from a WhatsApp link without logging in) plus when the
-- receipt was last sent.
alter table public.orders
  add column if not exists receipt_token uuid not null default gen_random_uuid(),
  add column if not exists receipt_sent_at timestamptz;
