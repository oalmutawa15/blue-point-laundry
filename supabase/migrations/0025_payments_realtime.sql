-- Publish payments for Realtime so the payment-result page can flip to
-- "confirmed" the instant the webhook (or any server path) settles the payment,
-- even after the page's polling window ends. RLS still applies: a customer only
-- receives their own payment rows.
alter publication supabase_realtime add table payments;
