-- 0002_products.sql
-- Products are tenant-scoped with a flexible JSONB attribute schema.

create type public.product_status as enum ('draft', 'active', 'archived');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  price_minor bigint not null check (price_minor >= 0),
  currency text not null default 'GHS',
  stock integer not null default 0 check (stock >= 0),
  images jsonb not null default '[]'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  status public.product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index products_tenant_status_idx on public.products (tenant_id, status);
create index products_tenant_slug_idx on public.products (tenant_id, slug);

comment on column public.products.price_minor is 'Price in minor units (pesewas) for the currency column';
comment on column public.products.attributes is 'Category-specific attributes, e.g. {"size": "M", "colour": "Red"}';
