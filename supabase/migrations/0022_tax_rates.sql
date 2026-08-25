create table public.tax_rates (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  name         text not null,
  rate_pct     numeric(5,2) not null default 0,
  applies_to   text not null default 'all',
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.tax_rates enable row level security;

create policy "Tenant owners manage their tax rates"
  on public.tax_rates for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);
