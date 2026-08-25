create table public.product_variants (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  name         text not null,
  sku          text,
  price_override_minor bigint,
  stock        integer not null default 0,
  attributes   jsonb not null default '{}',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.product_variants enable row level security;

create policy "Public read for active product variants"
  on public.product_variants for select
  using (true);

create policy "Tenant owners manage their product variants"
  on public.product_variants for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

create index idx_product_variants_product_id on public.product_variants(product_id);
