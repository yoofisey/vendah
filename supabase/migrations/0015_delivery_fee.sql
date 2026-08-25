-- 0015_delivery_fee.sql
-- Merchants can set a flat delivery fee charged when customers choose delivery.
-- Stored in minor units (pesewas). 0 means free delivery.

alter table public.tenants add column delivery_fee_minor bigint not null default 0;
