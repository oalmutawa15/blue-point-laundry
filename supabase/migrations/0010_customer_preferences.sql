-- Customer laundry preferences (ghotra type, nasha amount, perfume), stored as JSON.
alter table profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
