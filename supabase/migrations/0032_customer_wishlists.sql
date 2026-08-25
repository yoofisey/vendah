create table public.customer_wishlists (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  customer_email text not null,
  product_id   uuid not null references public.products(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(tenant_id, customer_email, product_id)
);

alter table public.customer_wishlists enable row level security;

create policy "Public read for wishlists"
  on public.customer_wishlists for select
  using (true);

create policy "Customers manage their own wishlists"
  on public.customer_wishlists for all
  using (true)
  with check (true);
