-- 0007_pricing_tiers: Free/Industry tiers, per-tier sales fee and product caps

alter type public.subscription_tier add value 'free' before 'starter';
alter type public.subscription_tier add value 'industry' after 'growth';

alter table public.subscriptions
  add column sales_fee_pct integer not null default 0;

-- Align existing subscriptions with the new caps.
update public.subscriptions
  set product_limit = 40
  where tier = 'starter' and product_limit is distinct from 40;

update public.subscriptions
  set product_limit = 80
  where tier = 'growth' and product_limit is distinct from 80;

comment on column public.subscriptions.sales_fee_pct is
  'Platform commission on sales (percent). 6 for free tier, 0 for paid tiers. Mirrored to the Paystack subaccount split percentage.';
comment on column public.subscriptions.product_limit is
  'Product inventory cap for the tier; null = unlimited. Free=20, Starter=40, Growth=80, Industry=null.';
