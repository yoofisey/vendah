create type public.staff_role as enum ('owner', 'manager', 'staff');

create table public.staff_members (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         public.staff_role not null default 'staff',
  invited_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  unique(tenant_id, user_id)
);

alter table public.staff_members enable row level security;

create policy "Tenant owners manage staff"
  on public.staff_members for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);
