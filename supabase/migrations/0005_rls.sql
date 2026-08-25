-- 0005_rls.sql
-- Row-Level Security: tenant data isolation + public storefront reads.

-- ==== Helpers ====
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Returns the tenant id owned by the current auth user, or null.
create or replace function public.current_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.tenants where owner_id = auth.uid()
$$;

-- ==== updated_at triggers ====
create trigger tenants_set_updated_at before update on public.tenants
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ==== Enable RLS ====
alter table public.business_categories enable row level security;
alter table public.tenants enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;

-- ==== business_categories: public read ====
create policy "categories_public_read" on public.business_categories
  for select using (true);

-- ==== tenants: public read (storefront resolution), owner read/write ====
create policy "tenants_public_read" on public.tenants
  for select using (status = 'active');

create policy "tenants_owner_select" on public.tenants
  for select using (owner_id = auth.uid());

create policy "tenants_owner_update" on public.tenants
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ==== products: public read active products of active tenants, owner CRUD ====
create policy "products_public_read" on public.products
  for select using (
    status = 'active'
    and exists (
      select 1 from public.tenants t
      where t.id = products.tenant_id and t.status = 'active'
    )
  );

create policy "products_owner_select" on public.products
  for select using (tenant_id = public.current_tenant_id());

create policy "products_owner_insert" on public.products
  for insert with check (tenant_id = public.current_tenant_id());

create policy "products_owner_update" on public.products
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "products_owner_delete" on public.products
  for delete using (tenant_id = public.current_tenant_id());

-- ==== orders / order_items: owner only ====
-- Customers place orders server-side (service role), so anon role has no access.
create policy "orders_owner_select" on public.orders
  for select using (tenant_id = public.current_tenant_id());

create policy "orders_owner_update" on public.orders
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "order_items_owner_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.tenant_id = public.current_tenant_id()
    )
  );

-- ==== transactions: owner only ====
create policy "transactions_owner_select" on public.transactions
  for select using (tenant_id = public.current_tenant_id());

-- ==== subscriptions: owner only ====
create policy "subscriptions_owner_select" on public.subscriptions
  for select using (tenant_id = public.current_tenant_id());
