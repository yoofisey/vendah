alter table public.orders add column discount_code text;
alter table public.orders add column discount_minor bigint not null default 0;
