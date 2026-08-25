create table public.customer_accounts (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text,
  email        text not null,
  phone        text,
  created_at   timestamptz not null default now(),
  unique(tenant_id, user_id)
);

alter table public.customer_accounts enable row level security;

create policy "Customers manage their own account"
  on public.customer_accounts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Tenant owners can view customer accounts"
  on public.customer_accounts for select
  using (public.current_tenant_id() = tenant_id);
