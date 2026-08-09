-- Cancel an order + issue a refund (to wallet if it was paid from the wallet).
alter table orders add column if not exists cancel_reason text;
alter table orders add column if not exists refund_fils bigint;

-- One refund per order (so cancelling twice can't double-refund).
create unique index if not exists credit_transactions_refund_order_key
  on credit_transactions (order_id) where type = 'refund' and order_id is not null;

create or replace function public.wallet_refund(p_customer uuid, p_amount bigint, p_order uuid, p_note text default null)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_inserted int;
begin
  if p_amount is null or p_amount <= 0 then return; end if;
  insert into credit_transactions (customer_id, amount_fils, type, order_id, note)
    values (p_customer, p_amount, 'refund', p_order, coalesce(p_note, 'Refund'))
    on conflict (order_id) where type = 'refund' and order_id is not null do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    update profiles set credit_fils = credit_fils + p_amount where id = p_customer;
  end if;
end $function$;

revoke all on function public.wallet_refund(uuid, bigint, uuid, text) from public, anon, authenticated;
