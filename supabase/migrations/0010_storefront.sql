-- 0010_storefront.sql
-- Storefront enhancements: tenant-scoped product categories, per-product
-- category assignment, and a "featured" flag for the storefront homepage.

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

alter table public.products
  add column category_id uuid references public.product_categories(id) on delete set null,
  add column featured boolean not null default false;

create index product_categories_tenant_idx on public.product_categories (tenant_id, sort_order);
create index products_tenant_category_status_idx on public.products (tenant_id, category_id, status);
create index products_tenant_featured_status_idx on public.products (tenant_id, featured, status);

-- ==== RLS ====
alter table public.product_categories enable row level security;

create policy "product_categories_public_read" on public.product_categories
  for select using (
    exists (
      select 1 from public.tenants t
      where t.id = product_categories.tenant_id and t.status = 'active'
    )
  );

create policy "product_categories_owner_select" on public.product_categories
  for select using (tenant_id = public.current_tenant_id());

create policy "product_categories_owner_insert" on public.product_categories
  for insert with check (tenant_id = public.current_tenant_id());

create policy "product_categories_owner_delete" on public.product_categories
  for delete using (tenant_id = public.current_tenant_id());
