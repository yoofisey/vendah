create table public.return_requests (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  order_id     uuid not null references public.orders(id) on delete cascade,
  reason       text not null,
  status       text not null default 'pending',
  refund_minor bigint,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

alter table public.return_requests enable row level security;

create policy "Customers can create return requests"
  on public.return_requests for insert
  with check (true);

create policy "Tenant owners manage returns"
  on public.return_requests for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);
