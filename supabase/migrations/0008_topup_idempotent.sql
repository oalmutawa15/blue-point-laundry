-- Make wallet top-ups idempotent so a payment can never be credited twice
-- (the browser-return and the server webhook both finalize the same payment).

-- One credited top-up per payment reference.
create unique index if not exists credit_transactions_topup_reference_key
  on credit_transactions (reference)
  where type = 'topup' and reference is not null;

create or replace function public.wallet_topup(
  p_customer uuid,
  p_amount bigint,
  p_reference text default null,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_inserted int;
begin
  if p_amount <= 0 then raise exception 'Top-up amount must be positive'; end if;

  insert into credit_transactions (customer_id, amount_fils, type, reference, note)
    values (p_customer, p_amount, 'topup', p_reference, coalesce(p_note, 'Wallet top-up'))
    on conflict (reference) where type = 'topup' and reference is not null
    do nothing;

  -- Only move the balance if this call actually inserted the transaction.
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    update profiles set credit_fils = credit_fils + p_amount where id = p_customer;
  end if;
end;
$function$;
