create table public.back_in_stock_notifications (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  email        text not null,
  notified     boolean not null default false,
  created_at   timestamptz not null default now(),
  unique(tenant_id, product_id, email)
);

alter table public.back_in_stock_notifications enable row level security;

create policy "Anyone can subscribe to back in stock"
  on public.back_in_stock_notifications for insert
  with check (true);

create policy "Tenant owners can view and update notifications"
  on public.back_in_stock_notifications for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

create index idx_back_in_stock_pending on public.back_in_stock_notifications(tenant_id, product_id) where notified = false;
