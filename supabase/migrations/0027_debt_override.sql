-- Let the shop deliver an order to a customer who is in debt, at its discretion.
-- Normally an order can't advance to ready/delivery while the wallet is negative;
-- when the shop chooses "deliver anyway", we set debt_override on the order and
-- the gate is skipped for it.
alter table orders add column if not exists debt_override boolean not null default false;

create or replace function public.orders_before_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare bal bigint;
begin
  new.updated_at = now();

  if new.status = 'washing' and old.status is distinct from 'washing'
     and not coalesce(new.charged, false) then
    if new.price_fils is null then
      raise exception 'Order % has no price; cannot start washing', new.order_no;
    end if;
    insert into credit_transactions (customer_id, amount_fils, type, order_id, note)
      values (new.customer_id, -new.price_fils, 'order_charge', new.id, 'Order ' || new.order_no);
    update profiles set credit_fils = credit_fils - new.price_fils where id = new.customer_id;
    new.charged = true;
  end if;

  if new.status in ('ready', 'delivering') and old.status is distinct from new.status
     and not (old.status = 'delivering' and new.status = 'ready')
     and not coalesce(new.debt_override, false) then
    select credit_fils into bal from profiles where id = new.customer_id;
    if bal < 0 then
      raise exception 'CUSTOMER_IN_DEBT';
    end if;
  end if;

  return new;
end $function$;
