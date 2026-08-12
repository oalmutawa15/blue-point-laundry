-- Audit trail: record exactly what UPayments returned when we settled a payment.
-- Every credit from now on carries the gateway's own result (e.g. "CAPTURED"),
-- so a genuine payment is always provable and can never be confused with a
-- never-paid attempt.
alter table payments
  add column if not exists provider_result text,
  add column if not exists verified_at timestamptz;
