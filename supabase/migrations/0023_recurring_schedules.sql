-- Recurring weekly schedules.
--   kind = 'pickup'   → the customer's own repeating pickup days (auto-creates a
--                       pickup request from their default address each chosen day).
--   kind = 'delivery' → a shop-managed repeating delivery plan for a chosen
--                       customer (dispatches that customer's ready orders on each
--                       chosen day, via the assigned driver).
-- weekdays: array of 0..6 where 0 = Sunday .. 6 = Saturday (JS getDay convention).
create table if not exists recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('pickup', 'delivery')),
  address_id uuid references addresses(id) on delete set null,
  driver_id uuid references profiles(id) on delete set null,
  weekdays smallint[] not null default '{}',
  active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  last_run_date date,
  created_at timestamptz not null default now()
);
create index if not exists recurring_schedules_customer_idx on recurring_schedules (customer_id);
create index if not exists recurring_schedules_active_idx on recurring_schedules (active) where active;

alter table recurring_schedules enable row level security;

-- Customers manage their OWN schedules (the pickup UI). Staff and the cron use
-- the service-role client, which bypasses RLS.
drop policy if exists rs_own_all on recurring_schedules;
create policy rs_own_all on recurring_schedules
  for all
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());
