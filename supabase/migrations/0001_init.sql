-- Blue Point Laundry — initial schema
-- Money is stored as integer FILS (1 KWD = 1000 fils) to avoid floating point.

create extension if not exists pgcrypto;

-- =========================================================
-- Enums
-- =========================================================
create type user_role as enum ('customer', 'shop', 'driver', 'admin');

create type order_status as enum (
  'requested',        -- customer requested pickup
  'pickup_assigned',  -- shop assigned a pickup driver
  'picked_up',        -- driver collected from customer
  'at_shop',          -- dropped at shop
  'priced',           -- shop counted pieces + set price/date
  'processing',       -- being cleaned
  'out_for_delivery', -- delivery driver on the way back
  'completed',        -- delivered to customer (credit charged)
  'cancelled'
);

create type credit_txn_type as enum ('topup', 'order_charge', 'refund', 'adjustment');
create type payment_status as enum ('pending', 'paid', 'failed', 'cancelled');

-- =========================================================
-- profiles (one row per auth user)
-- =========================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  full_name text,
  role user_role not null default 'customer',
  credit_fils bigint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Role helpers (security definer to avoid RLS recursion on profiles)
create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_staff() returns boolean  -- shop OR admin
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('shop', 'admin'));
$$;

-- Create a profile automatically when an auth user is created
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, full_name, role)
  values (
    new.id,
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone', ''),
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Prevent clients from changing their own role/credit; allow definer funcs + admins
create or replace function profiles_protect_columns() returns trigger
  language plpgsql as $$
begin
  if (new.role is distinct from old.role or new.credit_fils is distinct from old.credit_fils)
     and current_user = 'authenticated' and not is_admin() then
    raise exception 'Not allowed to modify role or credit directly';
  end if;
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_protect before update on profiles
  for each row execute function profiles_protect_columns();

-- =========================================================
-- addresses
-- =========================================================
create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  label text,
  area text not null,
  block text,
  street text,
  building text,
  floor text,
  apartment text,
  extra_directions text,
  contact_phone text,
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_customer_idx on addresses (customer_id);

-- =========================================================
-- orders
-- =========================================================
create sequence order_no_seq start 1001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null default 'BP-' || lpad(nextval('order_no_seq')::text, 6, '0'),
  customer_id uuid not null references profiles(id) on delete restrict,
  pickup_address_id uuid references addresses(id) on delete set null,
  status order_status not null default 'requested',
  pickup_driver_id uuid references profiles(id) on delete set null,
  delivery_driver_id uuid references profiles(id) on delete set null,
  piece_count int,
  price_fils bigint check (price_fils is null or price_fils >= 0),
  delivery_date date,
  customer_note text,
  staff_note text,
  charged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_idx on orders (customer_id);
create index orders_status_idx on orders (status);
create index orders_pickup_driver_idx on orders (pickup_driver_id);
create index orders_delivery_driver_idx on orders (delivery_driver_id);

-- =========================================================
-- order_items (itemized pieces / pricing)
-- =========================================================
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  service text not null default 'wash',   -- wash / iron / wash_iron / dry_clean
  garment text,
  qty int not null default 1 check (qty > 0),
  unit_price_fils bigint not null default 0 check (unit_price_fils >= 0),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on order_items (order_id);

-- =========================================================
-- order_events (status timeline)
-- =========================================================
create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  note text,
  actor_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on order_events (order_id);

-- =========================================================
-- credit_transactions (wallet ledger)
-- =========================================================
create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  amount_fils bigint not null,           -- positive = credit, negative = debit
  type credit_txn_type not null,
  order_id uuid references orders(id) on delete set null,
  reference text,
  note text,
  created_at timestamptz not null default now()
);
create index credit_txn_customer_idx on credit_transactions (customer_id, created_at desc);

-- =========================================================
-- payments (UPayments top-up sessions; mock for now)
-- =========================================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  amount_fils bigint not null check (amount_fils > 0),
  status payment_status not null default 'pending',
  provider text not null default 'upayments_mock',
  provider_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index payments_customer_idx on payments (customer_id, created_at desc);

-- =========================================================
-- otp_codes (address verification)
-- =========================================================
create table otp_codes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  code text not null,
  purpose text not null default 'address',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index otp_customer_idx on otp_codes (customer_id, created_at desc);

-- =========================================================
-- Triggers: order timeline + auto-charge on completion
-- =========================================================
create or replace function orders_before_update() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();

  -- Charge the customer's wallet once, when the order is completed.
  if new.status = 'completed' and old.status is distinct from 'completed'
     and not coalesce(new.charged, false) then
    if new.price_fils is null then
      raise exception 'Order % has no price; cannot complete', new.order_no;
    end if;
    insert into credit_transactions (customer_id, amount_fils, type, order_id, note)
      values (new.customer_id, -new.price_fils, 'order_charge', new.id, 'Order ' || new.order_no);
    update profiles set credit_fils = credit_fils - new.price_fils where id = new.customer_id;
    new.charged = true;
  end if;

  return new;
end $$;

create trigger orders_before_update_trg before update on orders
  for each row execute function orders_before_update();

create or replace function orders_log_event() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into order_events (order_id, status, actor_id) values (new.id, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into order_events (order_id, status, actor_id) values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;

create trigger orders_log_event_trg after insert or update on orders
  for each row execute function orders_log_event();

-- =========================================================
-- Wallet top-up (service_role only — called by payment confirm)
-- =========================================================
create or replace function wallet_topup(
  p_customer uuid, p_amount bigint, p_reference text default null, p_note text default null
) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if p_amount <= 0 then raise exception 'Top-up amount must be positive'; end if;
  insert into credit_transactions (customer_id, amount_fils, type, reference, note)
    values (p_customer, p_amount, 'topup', p_reference, coalesce(p_note, 'Wallet top-up'));
  update profiles set credit_fils = credit_fils + p_amount where id = p_customer;
end $$;

-- =========================================================
-- Grants
-- =========================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- Lock down privileged / sensitive functions
revoke all on function wallet_topup(uuid, bigint, text, text) from public, anon, authenticated;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table profiles enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table credit_transactions enable row level security;
alter table payments enable row level security;
alter table otp_codes enable row level security;

-- profiles
create policy profiles_select_self on profiles for select
  using (id = auth.uid() or is_staff());
create policy profiles_select_driver_customers on profiles for select
  using (exists (
    select 1 from orders o
    where o.customer_id = profiles.id
      and (o.pickup_driver_id = auth.uid() or o.delivery_driver_id = auth.uid())
  ));
create policy profiles_update_self on profiles for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());
create policy profiles_admin_all on profiles for all
  using (is_admin()) with check (is_admin());

-- addresses
create policy addresses_owner on addresses for all
  using (customer_id = auth.uid() or is_staff())
  with check (customer_id = auth.uid() or is_staff());
create policy addresses_driver_read on addresses for select
  using (exists (
    select 1 from orders o
    where o.pickup_address_id = addresses.id
      and (o.pickup_driver_id = auth.uid() or o.delivery_driver_id = auth.uid())
  ));

-- orders
create policy orders_select on orders for select
  using (
    customer_id = auth.uid() or is_staff()
    or pickup_driver_id = auth.uid() or delivery_driver_id = auth.uid()
  );
create policy orders_insert on orders for insert
  with check ((customer_id = auth.uid() and status = 'requested') or is_staff());
create policy orders_update on orders for update
  using (
    is_staff()
    or pickup_driver_id = auth.uid() or delivery_driver_id = auth.uid()
    or (customer_id = auth.uid() and status = 'requested')
  )
  with check (
    is_staff()
    or pickup_driver_id = auth.uid() or delivery_driver_id = auth.uid()
    or (customer_id = auth.uid())
  );

-- order_items
create policy order_items_select on order_items for select
  using (exists (
    select 1 from orders o where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or is_staff()
           or o.pickup_driver_id = auth.uid() or o.delivery_driver_id = auth.uid())
  ));
create policy order_items_write on order_items for all
  using (is_staff()) with check (is_staff());

-- order_events (insert handled by triggers; clients read only)
create policy order_events_select on order_events for select
  using (exists (
    select 1 from orders o where o.id = order_events.order_id
      and (o.customer_id = auth.uid() or is_staff()
           or o.pickup_driver_id = auth.uid() or o.delivery_driver_id = auth.uid())
  ));

-- credit_transactions (writes via definer functions/triggers only)
create policy credit_txn_select on credit_transactions for select
  using (customer_id = auth.uid() or is_staff());

-- payments
create policy payments_select on payments for select
  using (customer_id = auth.uid() or is_staff());
create policy payments_insert_own on payments for insert
  with check (customer_id = auth.uid());
create policy payments_admin_update on payments for update
  using (is_admin()) with check (is_admin());

-- otp_codes: no client policies (all access via server/service_role)
