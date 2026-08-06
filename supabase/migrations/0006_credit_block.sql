-- Prepaid enforcement: the wallet can no longer go negative. Completing an order
-- raises INSUFFICIENT_CREDIT if the customer's balance can't cover the price.
create or replace function orders_before_update() returns trigger
  language plpgsql security definer set search_path = public as $$
declare bal bigint;
begin
  new.updated_at = now();
  if new.status = 'completed' and old.status is distinct from 'completed'
     and not coalesce(new.charged, false) then
    if new.price_fils is null then
      raise exception 'Order % has no price; cannot complete', new.order_no;
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
end $$;
