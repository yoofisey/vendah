-- Loyalty / rewards: customers earn points on paid purchases and redeem
-- points at checkout for store credit.

create table public.loyalty_settings (
  tenant_id       uuid primary key references public.tenants(id) on delete cascade,
  enabled         boolean not null default false,
  points_per_ghs  bigint not null default 1,    -- points earned per GH₵1 spent
  points_to_minor bigint not null default 100,  -- minor units credited per point redeemed (1pt = GH₵1.00)
  updated_at      timestamptz not null default now()
);

create table public.loyalty_members (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  email          text not null,
  points_balance bigint not null default 0 check (points_balance >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index loyalty_members_tenant_email_idx on public.loyalty_members(tenant_id, lower(email));

create index loyalty_members_tenant_idx on public.loyalty_members(tenant_id);

create table public.loyalty_ledger (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  email      text not null,
  delta      bigint not null,
  reason     text not null,
  order_id   uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index loyalty_ledger_tenant_idx on public.loyalty_ledger(tenant_id, created_at desc);

-- Points/settings awarded on an order.
alter table public.orders add column if not exists loyalty_points_awarded bigint not null default 0;
alter table public.orders add column if not exists loyalty_points_redeemed bigint not null default 0;
alter table public.orders add column if not exists loyalty_credit_minor bigint not null default 0;

alter table public.loyalty_settings enable row level security;
alter table public.loyalty_members enable row level security;
alter table public.loyalty_ledger enable row level security;

create policy "Tenant owners manage loyalty settings"
  on public.loyalty_settings for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

create policy "Tenant owners manage loyalty members"
  on public.loyalty_members for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

create policy "Tenant owners manage loyalty ledger"
  on public.loyalty_ledger for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

-- Atomically award points to a member (creating the member if needed).
create or replace function public.award_loyalty_points(
  p_tenant_id uuid,
  p_email text,
  p_points bigint,
  p_order_id uuid,
  p_reason text
) returns void language plpgsql security definer as $$
begin
  if p_points <= 0 then return; end if;

  insert into public.loyalty_members(tenant_id, email, points_balance)
  values (p_tenant_id, lower(trim(p_email)), p_points)
  on conflict (tenant_id, lower(email))
  do update set points_balance = public.loyalty_members.points_balance + p_points,
                updated_at = now();

  insert into public.loyalty_ledger(tenant_id, email, delta, reason, order_id)
  values (p_tenant_id, lower(trim(p_email)), p_points, p_reason, p_order_id);
end;
$$;

-- Atomically redeem points for store credit. Returns credit in minor units.
create or replace function public.redeem_loyalty_points(
  p_tenant_id uuid,
  p_email text,
  p_points bigint,
  p_order_id uuid,
  p_points_to_minor bigint
) returns bigint language plpgsql security definer as $$
declare
  v_balance bigint;
  v_credit bigint;
begin
  if p_points <= 0 then
    return 0;
  end if;

  select points_balance into v_balance
  from public.loyalty_members
  where tenant_id = p_tenant_id and lower(email) = lower(trim(p_email))
  for update;

  if v_balance is null or v_balance < p_points then
    return -1; -- insufficient points
  end if;

  update public.loyalty_members
  set points_balance = points_balance - p_points, updated_at = now()
  where tenant_id = p_tenant_id and lower(email) = lower(trim(p_email));

  v_credit := p_points * p_points_to_minor;

  insert into public.loyalty_ledger(tenant_id, email, delta, reason, order_id)
  values (p_tenant_id, lower(trim(p_email)), -p_points, 'checkout-redeem', p_order_id);

  return v_credit;
end;
$$;

-- Create a default settings row for every tenant.
insert into public.loyalty_settings(tenant_id)
select id from public.tenants
on conflict (tenant_id) do nothing;

-- Reverse a checkout redemption (used when the order/payment later fails).
create or replace function public.refund_loyalty_points(
  p_tenant_id uuid,
  p_email text,
  p_points bigint,
  p_order_id uuid,
  p_reason text
) returns void language plpgsql security definer as $$
begin
  if p_points <= 0 then return; end if;

  insert into public.loyalty_members(tenant_id, email, points_balance)
  values (p_tenant_id, lower(trim(p_email)), p_points)
  on conflict (tenant_id, lower(email))
  do update set points_balance = public.loyalty_members.points_balance + p_points,
                updated_at = now();

  insert into public.loyalty_ledger(tenant_id, email, delta, reason, order_id)
  values (p_tenant_id, lower(trim(p_email)), p_points, p_reason, p_order_id);
end;
$$;

