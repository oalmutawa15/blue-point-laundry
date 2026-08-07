-- Staff/admin/driver accounts require a password (bcrypt via pgcrypto).
-- Customers stay phone-only.
alter table profiles add column login_password_hash text;

-- Set/update a staff password (service_role only — called from admin actions).
create or replace function set_login_password(p_user uuid, p_password text)
returns void
  language sql security definer set search_path = public, extensions as $$
  update profiles
     set login_password_hash = crypt(p_password, gen_salt('bf'))
   where id = p_user;
$$;

-- Login gate: for a phone, does it need a password and (if so) is it correct?
create or replace function check_staff_login(p_phone text, p_password text)
returns table(needs_password boolean, password_ok boolean)
  language sql security definer set search_path = public, extensions as $$
  select
    (p.role <> 'customer') as needs_password,
    case
      when p.role = 'customer' then true
      when p.login_password_hash is null then false
      else (p.login_password_hash = crypt(p_password, p.login_password_hash))
    end as password_ok
  from profiles p
  where p.phone = p_phone;
$$;

revoke all on function set_login_password(uuid, text) from public, anon, authenticated;
revoke all on function check_staff_login(text, text) from public, anon, authenticated;
