-- Next-day driver dispatch: the Kuwait calendar day the currently-assigned
-- driver should act on this order. Set to the day AFTER assignment, so the
-- driver only sees it from 00:00 (Asia/Kuwait) the next day. Reset each time a
-- new driver leg is assigned (pickup, then later delivery).
alter table public.orders
  add column if not exists dispatch_date date;

comment on column public.orders.dispatch_date is
  'Kuwait day the assigned driver should act (= day after assignment). Driver sees the order from 00:00 that day; orders still pending after that day are "late".';
