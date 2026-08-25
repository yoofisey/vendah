-- 0011_fulfilment.sql
-- Fulfilment workflow: add processing / shipped / delivered order statuses and
-- track when an order's status last changed.

-- NB: the new enum values are added but not referenced in this transaction
-- (Postgres forbids using a newly-added enum value in the same transaction).

alter type public.order_status add value 'processing' after 'paid';
alter type public.order_status add value 'shipped' after 'processing';
alter type public.order_status add value 'delivered' after 'shipped';

alter table public.orders
  add column status_updated_at timestamptz;
