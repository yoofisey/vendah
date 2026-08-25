create table public.shipping_zones (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  name         text not null,
  fee_minor    bigint not null default 0,
  free_above_minor bigint,
  sort_order   bigint not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.shipping_zones enable row level security;

create policy "Tenant owners manage their shipping zones"
  on public.shipping_zones for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

create index idx_shipping_zones_tenant on public.shipping_zones(tenant_id, sort_order);
