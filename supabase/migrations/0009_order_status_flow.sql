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
