-- Aggregated customer list for the shop Customers page: order count, last order
-- date, and pending (priced-but-not-yet-paid) amount per customer. Called from a
-- staff-only page via the service-role client.
create or replace function public.shop_customer_list()
returns table (
  id uuid,
  full_name text,
  phone text,
  credit_fils integer,
  orders_count bigint,
  last_order_at timestamptz,
  pending_fils bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.phone,
    p.credit_fils,
    count(o.id) filter (where o.status <> 'cancelled') as orders_count,
    max(o.created_at) filter (where o.status <> 'cancelled') as last_order_at,
    coalesce(sum(o.price_fils) filter (where o.status = 'awaiting_payment'), 0) as pending_fils
  from profiles p
  left join orders o on o.customer_id = p.id
  where p.role = 'customer'
  group by p.id, p.full_name, p.phone, p.credit_fils, p.created_at
  order by max(o.created_at) desc nulls last, p.created_at desc;
$$;
