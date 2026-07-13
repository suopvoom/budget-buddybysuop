
-- Trigger: on new price_history row, if price dropped vs last recorded, notify users tracking this product
CREATE OR REPLACE FUNCTION public.notify_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_price NUMERIC;
  drop_pct NUMERIC;
  prod RECORD;
  wl RECORD;
  al RECORD;
BEGIN
  SELECT price INTO prev_price
  FROM public.price_history
  WHERE product_id = NEW.product_id
    AND marketplace_id = NEW.marketplace_id
    AND recorded_at < NEW.recorded_at
  ORDER BY recorded_at DESC
  LIMIT 1;

  IF prev_price IS NULL OR NEW.price >= prev_price THEN
    RETURN NEW;
  END IF;

  drop_pct := ROUND(((prev_price - NEW.price) / prev_price) * 100, 1);

  SELECT p.id, p.name, COALESCE(b.name, '') AS brand
  INTO prod
  FROM public.products p
  LEFT JOIN public.brands b ON b.id = p.brand_id
  WHERE p.id = NEW.product_id;

  IF prod.id IS NULL THEN RETURN NEW; END IF;

  -- Update products.current_price to the lowest current listing
  UPDATE public.products
  SET current_price = LEAST(current_price, NEW.price),
      updated_at = now()
  WHERE id = NEW.product_id;

  -- Notify wishlist trackers
  FOR wl IN
    SELECT DISTINCT user_id, target_price
    FROM public.wishlist_items
    WHERE product_ref = NEW.product_id::text
  LOOP
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      wl.user_id,
      'Price dropped ' || drop_pct || '%',
      prod.brand || ' ' || prod.name || ' now ₹' || NEW.price::text || ' (was ₹' || prev_price::text || ')',
      '/product/' || NEW.product_id::text
    );
  END LOOP;

  -- Trigger active price alerts whose target has been met
  FOR al IN
    SELECT id, user_id, target_price
    FROM public.price_alerts
    WHERE product_ref = NEW.product_id::text
      AND active = true
      AND triggered_at IS NULL
      AND (target_price IS NULL OR NEW.price <= target_price)
  LOOP
    UPDATE public.price_alerts
    SET triggered_at = now(), active = false
    WHERE id = al.id;

    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      al.user_id,
      'Target price reached',
      prod.brand || ' ' || prod.name || ' is now ₹' || NEW.price::text,
      '/product/' || NEW.product_id::text
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_price_drop ON public.price_history;
CREATE TRIGGER trg_notify_price_drop
AFTER INSERT ON public.price_history
FOR EACH ROW EXECUTE FUNCTION public.notify_price_drop();

-- Enable realtime on notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Allow users to mark their own notifications read
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
