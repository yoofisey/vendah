create table public.cart_recovery_logs (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  email        text not null,
  items_json   jsonb not null default '[]',
  total_minor  bigint not null default 0,
  recovered    boolean not null default false,
  sent_at      timestamptz not null default now(),
  recovered_at timestamptz
);

alter table public.cart_recovery_logs enable row level security;

create policy "Tenant owners manage their cart recovery logs"
  on public.cart_recovery_logs for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);
