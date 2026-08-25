-- 0003_orders.sql
-- Orders and order items. Order items snapshot name/price/attributes at purchase
-- time so catalogue edits or deletions never corrupt historical orders.

create type public.order_status as enum ('pending', 'paid', 'fulfilled', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  status public.order_status not null default 'pending',
  subtotal_minor bigint not null default 0,
  delivery_fee_minor bigint not null default 0,
  total_minor bigint not null default 0,
  currency text not null default 'GHS',
  delivery_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_tenant_created_idx on public.orders (tenant_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price_minor bigint not null check (price_minor >= 0),
  quantity integer not null check (quantity > 0),
  attributes jsonb not null default '{}'::jsonb
);

create index order_items_order_idx on public.order_items (order_id);
