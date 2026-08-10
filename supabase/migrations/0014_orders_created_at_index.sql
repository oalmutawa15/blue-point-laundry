-- Speeds up the shop board's default "newest first" ordering as order volume
-- grows. Idempotent, no data change.
create index if not exists orders_created_at_idx
  on public.orders using btree (created_at desc);
