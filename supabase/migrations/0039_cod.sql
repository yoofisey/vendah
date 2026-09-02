-- Cash on delivery support
-- Track how an order is expected to be paid, and when cash was collected.

alter table public.orders
  add column if not exists payment_method text;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('card', 'mtn', 'vodafone', 'airteltigo', 'cod'));

alter table public.orders
  add column if not exists payment_collected_at timestamptz;

create index if not exists orders_payment_method_idx
  on public.orders (payment_method);

-- Stale-order expiry must NOT cancel COD orders (they are legitimately awaiting
-- fulfilment/payment collection). Legacy rows without a payment_method keep
-- the old expiry behaviour.
CREATE OR REPLACE FUNCTION public.expire_stale_orders(
  p_max_age_minutes INTEGER DEFAULT 30
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE status = 'pending'
    AND payment_method IS DISTINCT FROM 'cod'
    AND created_at < now() - (p_max_age_minutes || ' minutes')::interval;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.transactions
  SET status = 'failed', updated_at = now()
  WHERE status = 'initiated'
    AND created_at < now() - (p_max_age_minutes || ' minutes')::interval;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;