-- 0004_transactions_subscriptions.sql
-- Payment transactions (provider references, reconciliation) and subscriptions.

create type public.payment_provider as enum ('paystack', 'flutterwave', 'mobile_money');
create type public.transaction_status as enum ('initiated', 'pending', 'success', 'failed');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'paused');
create type public.billing_cycle as enum ('monthly', 'annual');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  provider public.payment_provider not null,
  provider_reference text,
  amount_minor bigint not null,
  currency text not null default 'GHS',
  status public.transaction_status not null default 'initiated',
  reconciliation_status text not null default 'unmatched',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

create index transactions_tenant_created_idx on public.transactions (tenant_id, created_at desc);
create index transactions_reconciliation_idx on public.transactions (reconciliation_status);

comment on column public.transactions.reconciliation_status is 'unmatched | matched | ignored';

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  tier public.subscription_tier not null default 'starter',
  status public.subscription_status not null default 'trialing',
  billing_cycle public.billing_cycle not null default 'monthly',
  provider_subscription_id text,
  provider_customer_id text,
  product_limit integer,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.subscriptions.product_limit is 'Denormalised from tier for cheap enforcement; null = unlimited';
