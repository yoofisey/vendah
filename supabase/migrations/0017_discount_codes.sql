create type public.discount_type as enum ('percent', 'fixed');

create table public.discount_codes (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  code         text not null,
  discount_type public.discount_type not null,
  value        bigint not null,
  min_order_minor bigint not null default 0,
  max_uses     bigint,
  used_count   bigint not null default 0,
  starts_at    timestamptz,
  expires_at   timestamptz,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(tenant_id, code)
);

alter table public.discount_codes enable row level security;

create policy "Tenant owners manage their discount codes"
  on public.discount_codes for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

create index idx_discount_codes_tenant_code on public.discount_codes(tenant_id, code);

create or replace function public.increment_discount_usage(p_tenant_id uuid, p_code text)
returns void language sql security definer as $$
  update public.discount_codes
  set used_count = used_count + 1, updated_at = now()
  where tenant_id = p_tenant_id and code = p_code;
$$;
