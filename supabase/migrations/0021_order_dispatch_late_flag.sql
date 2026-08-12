-- Persists whether a driver leg was completed late (picked up / delivered after
-- its dispatch day). Stays true once set, so the shop still sees a "Late" mark
-- after the order has moved on from the driver.
alter table public.orders
  add column if not exists dispatch_late boolean not null default false;
