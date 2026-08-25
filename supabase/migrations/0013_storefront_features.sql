-- 0013_storefront_features.sql
-- Reviews, customer-facing order references, and homepage content fields.

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 3 and 1000),
  created_at timestamptz not null default now()
);

create index product_reviews_product_idx on public.product_reviews (product_id, created_at desc);
create index product_reviews_tenant_idx on public.product_reviews (tenant_id);

-- Customer-facing order reference used by the "Track my order" page.
alter table public.orders add column reference text;

update public.orders
  set reference = 'VH-' || upper(substr(md5(random()::text || id::text), 1, 8))
  where reference is null;

alter table public.orders alter column reference set not null;
create unique index orders_reference_unique on public.orders (reference);

-- Homepage content.
alter table public.tenants add column announcement text;
alter table public.tenants add column about_text text;
