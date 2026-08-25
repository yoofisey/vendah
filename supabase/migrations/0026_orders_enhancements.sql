alter table public.orders add column tax_minor bigint not null default 0;
alter table public.orders add column tax_rate_name text;
alter table public.orders add column shipping_zone_id uuid references public.shipping_zones(id);
alter table public.orders add column refund_minor bigint not null default 0;
alter table public.orders add column refund_reason text;
alter table public.orders add column refunded_at timestamptz;
