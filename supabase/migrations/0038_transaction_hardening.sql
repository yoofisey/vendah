-- Webhook event dedup table
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON webhook_events FOR ALL USING (true);

-- Atomic stock decrement with row-level locking
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  SELECT stock INTO v_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  IF v_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %: have %, need %', p_product_id, v_stock, p_quantity;
  END IF;

  UPDATE public.products
  SET stock = stock - p_quantity
  WHERE id = p_product_id;

  RETURN v_stock - p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic variant stock decrement with row-level locking
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  SELECT stock INTO v_stock
  FROM public.product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % not found', p_variant_id;
  END IF;

  IF v_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for variant %: have %, need %', p_variant_id, v_stock, p_quantity;
  END IF;

  UPDATE public.product_variants
  SET stock = stock - p_quantity
  WHERE id = p_variant_id;

  RETURN v_stock - p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic order settlement: mark paid, decrement stock, all in one transaction
CREATE OR REPLACE FUNCTION public.settle_order(
  p_tx_id UUID,
  p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_tenant_id UUID;
  v_item RECORD;
  v_new_stock INTEGER;
  v_result JSONB := '{"ok": false}'::jsonb;
BEGIN
  -- Lock and update transaction
  UPDATE public.transactions
  SET status = 'success',
      payload = p_payload,
      updated_at = now()
  WHERE id = p_tx_id AND status != 'success'
  RETURNING order_id INTO v_order_id;

  IF v_order_id IS NULL THEN
    -- Already settled or not found — fetch existing
    SELECT order_id INTO v_order_id
    FROM public.transactions
    WHERE id = p_tx_id;

    IF v_order_id IS NULL THEN
      RETURN '{"ok": false, "reason": "not_found"}'::jsonb;
    END IF;

    -- Already success
    SELECT tenant_id INTO v_tenant_id
    FROM public.orders WHERE id = v_order_id;

    RETURN jsonb_build_object(
      'ok', true,
      'order_id', v_order_id,
      'tenant_id', v_tenant_id,
      'already_settled', true
    );
  END IF;

  -- Lock and update order
  UPDATE public.orders
  SET status = 'paid', updated_at = now()
  WHERE id = v_order_id AND status = 'pending'
  RETURNING tenant_id INTO v_tenant_id;

  IF v_tenant_id IS NULL THEN
    -- Order was not pending (already processed or cancelled)
    SELECT tenant_id INTO v_tenant_id
    FROM public.orders WHERE id = v_order_id;

    RETURN jsonb_build_object(
      'ok', true,
      'order_id', v_order_id,
      'tenant_id', v_tenant_id,
      'already_settled', true
    );
  END IF;

  -- Decrement stock for each item
  FOR v_item IN
    SELECT product_id, variant_id, quantity, product_name
    FROM public.order_items
    WHERE order_id = v_order_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      v_new_stock := public.decrement_variant_stock(v_item.variant_id, v_item.quantity);
    ELSIF v_item.product_id IS NOT NULL THEN
      v_new_stock := public.decrement_stock(v_item.product_id, v_item.quantity);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'tenant_id', v_tenant_id,
    'already_settled', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire stale pending orders (for cron)
CREATE OR REPLACE FUNCTION public.expire_stale_orders(
  p_max_age_minutes INTEGER DEFAULT 30
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE status = 'pending'
    AND created_at < now() - (p_max_age_minutes || ' minutes')::interval;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Also mark related transactions as failed
  UPDATE public.transactions
  SET status = 'failed', updated_at = now()
  WHERE status = 'initiated'
    AND created_at < now() - (p_max_age_minutes || ' minutes')::interval;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
