-- Outbound notifications log (WhatsApp/Telegram). Written server-side (service_role);
-- swap the sender for the real WhatsApp Business API later.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  recipient_id uuid references profiles(id) on delete set null,
  recipient_phone text,
  channel text not null default 'whatsapp',
  template text not null,
  message text,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on notifications (recipient_id, created_at desc);
create index notifications_order_idx on notifications (order_id);

alter table notifications enable row level security;

-- Recipients see their own; staff/admin see all. Inserts happen via service_role only.
create policy notifications_select on notifications for select
  using (recipient_id = auth.uid() or is_staff());

grant select on notifications to authenticated;
grant all on notifications to service_role;
