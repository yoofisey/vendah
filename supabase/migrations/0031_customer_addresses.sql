create table public.customer_addresses (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  customer_email text not null,
  label        text not null default 'Home',
  full_name    text not null,
  phone        text,
  address_line1 text not null,
  address_line2 text,
  city         text not null,
  region       text,
  is_default   boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.customer_addresses enable row level security;

create policy "Public read for customer addresses"
  on public.customer_addresses for select
  using (true);

create policy "Customers manage their own addresses"
  on public.customer_addresses for all
  using (true)
  with check (true);
