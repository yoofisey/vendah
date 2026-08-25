-- 0008_checkout: Paystack subaccount per tenant and customer address on orders.

alter table public.tenants
  add column paystack_subaccount_code text;

comment on column public.tenants.paystack_subaccount_code is
  'Paystack subaccount for this vendor. Its percentage_charge mirrors subscriptions.sales_fee_pct (6 on free, 0 on paid) and drives the split on storefront charges.';

alter table public.orders
  add column customer_address text;
