-- Include customer_no in the shop customer list aggregate.
drop function if exists public.shop_customer_list();
create function public.shop_customer_list()
returns table (
  id uuid, customer_no bigint, full_name text, phone text, credit_fils integer,
  orders_count bigint, last_order_at timestamptz, pending_fils bigint
)
language sql stable security definer set search_path = public as $$
  select p.id, p.customer_no, p.full_name, p.phone, p.credit_fils,
    count(o.id) filter (where o.status <> 'cancelled') as orders_count,
    max(o.created_at) filter (where o.status <> 'cancelled') as last_order_at,
    coalesce(sum(o.price_fils) filter (where o.status = 'awaiting_payment'), 0) as pending_fils
  from profiles p
  left join orders o on o.customer_id = p.id
  where p.role = 'customer'
  group by p.id, p.customer_no, p.full_name, p.phone, p.credit_fils, p.created_at
  order by max(o.created_at) desc nulls last, p.customer_no desc;
$$;
