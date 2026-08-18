-- Permanent per-customer discount (%). Applied automatically when an order is
-- priced; the percentage in effect is snapshotted onto the order so receipts and
-- history show the discount that was actually given.
alter table profiles
  add column if not exists discount_percent smallint not null default 0
    check (discount_percent >= 0 and discount_percent <= 100);

alter table orders
  add column if not exists discount_percent smallint not null default 0;
