-- ============ 1. LISTINGS (product_marketplaces) ============
ALTER TABLE public.product_listings
  ADD COLUMN IF NOT EXISTS external_product_id text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT 'in_stock',
  ADD COLUMN IF NOT EXISTS data_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS normalized_url text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS last_error_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS product_listings_updated_at ON public.product_listings;
CREATE TRIGGER product_listings_updated_at BEFORE UPDATE ON public.product_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX IF NOT EXISTS product_listings_product_marketplace_uq
  ON public.product_listings (product_id, marketplace_id);
CREATE UNIQUE INDEX IF NOT EXISTS product_listings_external_uq
  ON public.product_listings (marketplace_id, external_product_id)
  WHERE external_product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS product_listings_normalized_url_uq
  ON public.product_listings (marketplace_id, normalized_url)
  WHERE normalized_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS product_listings_active_idx
  ON public.product_listings (is_active, last_checked);

CREATE OR REPLACE VIEW public.product_marketplaces
WITH (security_invoker = true) AS
  SELECT * FROM public.product_listings;
GRANT SELECT ON public.product_marketplaces TO anon, authenticated;
GRANT ALL ON public.product_marketplaces TO service_role;

-- ============ 2. PRICE HISTORY ============
ALTER TABLE public.price_history
  ADD COLUMN IF NOT EXISTS product_marketplace_id uuid REFERENCES public.product_listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mrp numeric,
  ADD COLUMN IF NOT EXISTS discount_percentage numeric,
  ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT 'in_stock',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS price_history_product_recorded_idx
  ON public.price_history (product_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS price_history_listing_recorded_idx
  ON public.price_history (product_marketplace_id, recorded_at DESC);

DROP POLICY IF EXISTS "Editors write price history" ON public.price_history;
CREATE POLICY "Editors write price history" ON public.price_history
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
GRANT INSERT ON public.price_history TO authenticated;
GRANT ALL ON public.price_history TO service_role;

-- ============ 3. PRODUCT IMAGES ============
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  position integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product images are public" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Editors manage product images" ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE INDEX IF NOT EXISTS product_images_product_idx ON public.product_images (product_id, position);

-- ============ 4. PRODUCT VARIANTS ============
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text,
  sku text,
  barcode text,
  size text,
  shade text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product variants are public" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Editors manage product variants" ON public.product_variants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE TRIGGER product_variants_updated_at BEFORE UPDATE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON public.product_variants (product_id);

-- ============ 5. PRODUCT TAGS ============
CREATE TABLE IF NOT EXISTS public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, tag)
);
GRANT SELECT ON public.product_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_tags TO authenticated;
GRANT ALL ON public.product_tags TO service_role;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product tags are public" ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "Editors manage product tags" ON public.product_tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE INDEX IF NOT EXISTS product_tags_tag_idx ON public.product_tags (tag);

-- ============ 6. MARKETPLACE INTEGRATIONS (config only, never secret values) ============
CREATE TABLE IF NOT EXISTS public.marketplace_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id uuid REFERENCES public.marketplaces(id) ON DELETE CASCADE,
  adapter_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  data_source_type text NOT NULL DEFAULT 'official_api',
  required_secrets text[] NOT NULL DEFAULT '{}',
  docs_url text,
  enabled boolean NOT NULL DEFAULT false,
  sync_interval_minutes integer NOT NULL DEFAULT 360,
  last_success_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_integrations TO authenticated;
GRANT ALL ON public.marketplace_integrations TO service_role;
ALTER TABLE public.marketplace_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read integrations" ON public.marketplace_integrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Admins manage integrations" ON public.marketplace_integrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER marketplace_integrations_updated_at BEFORE UPDATE ON public.marketplace_integrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 7. SYNC RUNS ============
CREATE TABLE IF NOT EXISTS public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter_key text NOT NULL,
  marketplace_id uuid REFERENCES public.marketplaces(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'running',
  trigger_source text NOT NULL DEFAULT 'manual',
  items_processed integer NOT NULL DEFAULT 0,
  items_updated integer NOT NULL DEFAULT 0,
  items_failed integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT ON public.sync_runs TO authenticated;
GRANT ALL ON public.sync_runs TO service_role;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read sync runs" ON public.sync_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE INDEX IF NOT EXISTS sync_runs_started_idx ON public.sync_runs (started_at DESC);

-- ============ 8. SEARCH / FILTER INDEXES ============
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS brands_name_trgm_idx ON public.brands USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products (sku);
CREATE INDEX IF NOT EXISTS products_barcode_idx ON public.products (barcode);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_brand_idx ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS products_price_idx ON public.products (current_price);
CREATE INDEX IF NOT EXISTS products_rating_idx ON public.products (rating DESC);