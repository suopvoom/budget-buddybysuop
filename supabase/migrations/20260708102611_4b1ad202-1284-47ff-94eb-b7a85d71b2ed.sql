
ALTER TABLE public.wishlist_items DROP CONSTRAINT wishlist_items_product_id_fkey;
ALTER TABLE public.wishlist_items ALTER COLUMN product_id TYPE TEXT USING product_id::text;
ALTER TABLE public.wishlist_items RENAME COLUMN product_id TO product_ref;

ALTER TABLE public.price_alerts DROP CONSTRAINT price_alerts_product_id_fkey;
ALTER TABLE public.price_alerts ALTER COLUMN product_id TYPE TEXT USING product_id::text;
ALTER TABLE public.price_alerts RENAME COLUMN product_id TO product_ref;
