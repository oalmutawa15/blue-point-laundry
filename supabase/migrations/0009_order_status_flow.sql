-- New order-status flow:
-- new -> pickup_requested -> picked_up -> counting -> awaiting_payment
--   -> washing -> ready -> delivering -> delivered (+ cancelled)
-- Wallet is charged when the shop confirms payment and starts washing.

ALTER TYPE order_status RENAME VALUE 'requested' TO 'new';
ALTER TYPE order_status RENAME VALUE 'pickup_assigned' TO 'pickup_requested';
ALTER TYPE order_status RENAME VALUE 'at_shop' TO 'counting';
ALTER TYPE order_status RENAME VALUE 'priced' TO 'awaiting_payment';
ALTER TYPE order_status RENAME VALUE 'processing' TO 'washing';
ALTER TYPE order_status RENAME VALUE 'out_for_delivery' TO 'delivering';
ALTER TYPE order_status RENAME VALUE 'completed' TO 'delivered';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready' BEFORE 'delivering';

-- Charge the wallet at "washing" (payment confirmed) instead of at delivery.
CREATE OR REPLACE FUNCTION public.orders_before_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare bal bigint;
begin
  new.updated_at = now();
  if new.status = 'washing' and old.status is distinct from 'washing'
     and not coalesce(new.charged, false) then
    if new.price_fils is null then
      raise exception 'Order % has no price; cannot start washing', new.order_no;
    end if;
    select credit_fils into bal from profiles where id = new.customer_id;
    if bal < new.price_fils then
      raise exception 'INSUFFICIENT_CREDIT';
    end if;
    insert into credit_transactions (customer_id, amount_fils, type, order_id, note)
      values (new.customer_id, -new.price_fils, 'order_charge', new.id, 'Order ' || new.order_no);
    update profiles set credit_fils = credit_fils - new.price_fils where id = new.customer_id;
    new.charged = true;
  end if;
  return new;
end $function$;

-- Phase 3: driver delivery photo.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_url text;

insert into storage.buckets (id, name, public)
values ('delivery-photos', 'delivery-photos', true)
on conflict (id) do nothing;

-- Admin dashboard stats referenced the old status labels; point them at the new ones.
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare result json;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select json_build_object(
    'orders_today', (select count(*) from orders where created_at::date = current_date),
    'completed_today', (select count(*) from orders where status = 'delivered' and updated_at::date = current_date),
    'pending_pickups', (select count(*) from orders where status in ('new','pickup_requested')),
    'cleaning', (select count(*) from orders where status in ('picked_up','counting','awaiting_payment','washing')),
    'ready_delivery', (select count(*) from orders where status in ('ready','delivering')),
    'cancelled_total', (select count(*) from orders where status = 'cancelled'),
    'active_customers', (select count(distinct customer_id) from orders where created_at > now() - interval '30 days'),
    'total_customers', (select count(*) from profiles where role = 'customer'),
    'new_customers_month', (select count(*) from profiles where role = 'customer' and created_at >= date_trunc('month', now())),
    'returning_customers', (select count(*) from (select customer_id from orders group by customer_id having count(*) > 1) x),
    'orders_total', (select count(*) from orders),
    'total_drivers', (select count(*) from profiles where role = 'driver'),
    'active_drivers', (select count(distinct id) from (
        select pickup_driver_id as id from orders where status = 'pickup_requested' and pickup_driver_id is not null
        union
        select delivery_driver_id from orders where status = 'delivering' and delivery_driver_id is not null
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
end $function$;
