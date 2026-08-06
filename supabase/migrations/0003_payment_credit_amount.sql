-- Prepaid packages: the wallet credit (with bonus) differs from the charged deposit.
-- amount_fils = deposit charged; credit_fils = amount credited to the wallet on success.
alter table payments add column credit_fils bigint;
