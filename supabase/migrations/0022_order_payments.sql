-- Per-order online payments (the walk-in "payment link" flow).
-- A payment can now belong to an order (kind = 'order') instead of only being a
-- wallet top-up (kind = 'topup'). The charged amount is always the order's own
-- price_fils, taken server-side — never from the customer's link — so the price
-- cannot be tampered with.
alter table payments
  add column if not exists order_id uuid references orders(id) on delete set null,
  add column if not exists kind text not null default 'topup';

create index if not exists payments_order_idx on payments (order_id);
