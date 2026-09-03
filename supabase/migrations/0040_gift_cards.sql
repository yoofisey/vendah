-- Gift cards: store credit a shop issues to customers.
-- A customer redeems a code at checkout to pay down their order total.

create table public.gift_cards (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  code              text not null,
  initial_value_minor bigint not null check (initial_value_minor > 0),
  balance_minor     bigint not null check (balance_minor >= 0),
  status            text not null default 'active' check (status in ('active','disabled','redeemed')),
  starts_at         timestamptz,
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(tenant_id, code)
);

alter table public.gift_cards enable row level security;

create policy "Tenant owners manage their gift cards"
  on public.gift_cards for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

create index idx_gift_cards_tenant_code on public.gift_cards(tenant_id, code);

-- Track which order (and how much) a gift card was applied to.
alter table public.orders add column if not exists gift_card_minor bigint not null default 0;
alter table public.orders add column if not exists gift_card_id uuid references public.gift_cards(id);

-- Add a note on the orders CHECK constraint: total_minor already accounts for
-- gift_card_minor in application code.

-- Atomically check and consume gift-card balance. Returns the amount actually
-- applied (capped at the requested amount and available balance).
create or replace function public.redeem_gift_card(
  p_tenant_id uuid,
  p_code text,
  p_amount_minor bigint
) returns bigint language plpgsql security definer as $$
declare
  v_balance bigint;
  v_applied bigint;
begin
  select balance_minor into v_balance
  from public.gift_cards
  where tenant_id = p_tenant_id and code = p_code
  for update;

  if v_balance is null then
    raise exception 'invalid_gift_card';
  end if;

  v_applied := least(p_amount_minor, v_balance);

  if v_applied > 0 then
    update public.gift_cards
    set balance_minor = balance_minor - v_applied,
        status = case when balance_minor - v_applied = 0 then 'redeemed' else status end,
        updated_at = now()
    where tenant_id = p_tenant_id and code = p_code;

    if v_balance - v_applied = 0 then
      update public.gift_cards set status = 'redeemed', updated_at = now()
      where tenant_id = p_tenant_id and code = p_code;
    end if;
  end if;

  return v_applied;
end;
$$;

-- Restore gift-card balance if an order is cancelled/refunded.
create or replace function public.restore_gift_card(
  p_gift_card_id uuid
) returns void language plpgsql security definer as $$
declare
  v_used bigint;
begin
  v_used := coalesce((
    select sum(gift_card_minor) from public.orders
    where gift_card_id = p_gift_card_id
      and status not in ('cancelled','refunded')
  ), 0);

  update public.gift_cards
  set balance_minor = initial_value_minor - v_used,
      status = case when initial_value_minor - v_used > 0 then 'active' else status end,
      updated_at = now()
  where id = p_gift_card_id;
end;
$$;
