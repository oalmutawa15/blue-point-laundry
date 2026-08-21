-- Optional "Avenue" line for an address (some Kuwait areas use avenues).
alter table addresses add column if not exists avenue text;
