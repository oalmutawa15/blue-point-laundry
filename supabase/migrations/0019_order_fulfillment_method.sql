-- How the finished order reaches the customer:
--   'delivery'    → one of our drivers delivers it (default)
--   'self_pickup' → the customer collects it from the shop themselves
--
-- A self_pickup order has no delivery-driver stage: after washing it becomes
-- "ready" (ready for the customer to collect) and the shop marks it collected.
alter table public.orders
  add column if not exists fulfillment text not null default 'delivery';

alter table public.orders
  drop constraint if exists orders_fulfillment_check;
alter table public.orders
  add constraint orders_fulfillment_check
  check (fulfillment in ('delivery', 'self_pickup'));
