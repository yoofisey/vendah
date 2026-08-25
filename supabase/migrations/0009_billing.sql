-- 0009_billing.sql: vendor subscription billing support.

alter table public.subscriptions
  add column provider_customer_email text;

comment on column public.subscriptions.provider_customer_email is
  'Paystack customer email for this vendor subscription. Used to match webhook events to tenants when metadata is not present.';
