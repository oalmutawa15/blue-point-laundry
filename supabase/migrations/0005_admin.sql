-- Admin: settings, activity log, wallet adjustment, and a dashboard stats aggregator.

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into settings (key, value) values
  ('cost_pct', '40'::jsonb),          -- estimated cost as % of revenue → net profit = revenue * (1 - cost_pct/100)
  ('price_list', '[]'::jsonb)         -- optional default garment prices (fils)
on conflict (key) do nothing;

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  target text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index activity_log_created_idx on activity_log (created_at desc);

alter table settings enable row level security;
alter table activity_log enable row level security;
create policy settings_admin_all on settings for all using (is_admin()) with check (is_admin());
create policy activity_admin_select on activity_log for select using (is_admin());

grant select on settings, activity_log to authenticated;
grant all on settings, activity_log to service_role;

-- Wallet correction by admin (service_role) with a ledger entry.
create or replace function wallet_adjust(p_customer uuid, p_amount bigint, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into credit_transactions (customer_id, amount_fils, type, note)
    values (p_customer, p_amount, 'adjustment', coalesce(p_note, 'Adjustment'));
  update profiles set credit_fils = credit_fils + p_amount where id = p_customer;
end $$;
revoke all on function wallet_adjust(uuid, bigint, text) from public, anon, authenticated;

-- All scalar dashboard stats in one admin-guarded call.
create or replace function admin_dashboard_stats()
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select json_build_object(
    'orders_today', (select count(*) from orders where created_at::date = current_date),
    'completed_today', (select count(*) from orders where status = 'completed' and updated_at::date = current_date),
    'pending_pickups', (select count(*) from orders where status in ('requested','pickup_assigned')),
    'cleaning', (select count(*) from orders where status in ('picked_up','at_shop','priced','processing')),
    'ready_delivery', (select count(*) from orders where status = 'out_for_delivery'),
    'cancelled_total', (select count(*) from orders where status = 'cancelled'),
    'active_customers', (select count(distinct customer_id) from orders where created_at > now() - interval '30 days'),
    'total_customers', (select count(*) from profiles where role = 'customer'),
    'new_customers_month', (select count(*) from profiles where role = 'customer' and created_at >= date_trunc('month', now())),
    'returning_customers', (select count(*) from (select customer_id from orders group by customer_id having count(*) > 1) x),
    'orders_total', (select count(*) from orders),
    'total_drivers', (select count(*) from profiles where role = 'driver'),
    'active_drivers', (select count(distinct id) from (
        select pickup_driver_id as id from orders where status = 'pickup_assigned' and pickup_driver_id is not null
        union
        select delivery_driver_id from orders where status = 'out_for_delivery' and delivery_driver_id is not null
      ) t),
    'revenue_today', (select coalesce(sum(price_fils),0) from orders where charged and updated_at::date = current_date),
    'revenue_week', (select coalesce(sum(price_fils),0) from orders where charged and updated_at >= date_trunc('week', now())),
    'revenue_month', (select coalesce(sum(price_fils),0) from orders where charged and updated_at >= date_trunc('month', now())),
    'orders_charged', (select count(*) from orders where charged),
    'avg_order_value', (select coalesce(avg(price_fils),0)::bigint from orders where charged),
    'wallet_held', (select coalesce(sum(credit_fils),0) from profiles where role = 'customer'),
    'total_topups', (select coalesce(sum(amount_fils),0) from credit_transactions where type = 'topup'),
    'total_deductions', (select coalesce(-sum(amount_fils),0) from credit_transactions where type = 'order_charge'),
    'revenue_daily', (select coalesce(json_agg(json_build_object('day', g::date, 'revenue',
        coalesce((select sum(o.price_fils) from orders o where o.charged and o.updated_at::date = g::date), 0)) order by g), '[]'::json)
        from generate_series(current_date - 13, current_date, interval '1 day') g)
  ) into result;
  return result;
end $$;
revoke all on function admin_dashboard_stats() from public, anon;
