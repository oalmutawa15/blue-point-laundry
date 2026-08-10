-- Stable numeric customer id shown in the shop Customers list.
alter table public.profiles add column if not exists customer_no bigint;
create sequence if not exists customer_no_seq;

update public.profiles p
set customer_no = sub.n
from (
  select id, 100000 + row_number() over (order by created_at) as n
  from public.profiles where role = 'customer'
) sub
where p.id = sub.id and p.customer_no is null;

select setval('customer_no_seq', (select coalesce(max(customer_no), 100000) from public.profiles), true);
alter table public.profiles alter column customer_no set default nextval('customer_no_seq');
