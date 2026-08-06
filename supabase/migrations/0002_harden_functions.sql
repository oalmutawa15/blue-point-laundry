-- Hardening: stop trigger/helper functions from being callable via the public RPC API,
-- and pin search_path on the remaining trigger function.

-- Trigger functions are never called via RPC — remove all direct EXECUTE.
revoke all on function handle_new_user() from public, anon, authenticated;
revoke all on function orders_before_update() from public, anon, authenticated;
revoke all on function orders_log_event() from public, anon, authenticated;
revoke all on function profiles_protect_columns() from public, anon, authenticated;

-- Role helpers are used inside RLS policies (need authenticated), but not by anon/RPC.
revoke all on function is_admin() from public, anon;
revoke all on function is_staff() from public, anon;

-- Pin search_path on the remaining trigger function.
create or replace function profiles_protect_columns() returns trigger
  language plpgsql set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.credit_fils is distinct from old.credit_fils)
     and current_user = 'authenticated' and not is_admin() then
    raise exception 'Not allowed to modify role or credit directly';
  end if;
  new.updated_at = now();
  return new;
end $$;
revoke all on function profiles_protect_columns() from public, anon, authenticated;
