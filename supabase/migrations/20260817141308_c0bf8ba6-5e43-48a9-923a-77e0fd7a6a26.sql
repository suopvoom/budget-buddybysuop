DELETE FROM public.price_history WHERE product_id IN (SELECT id FROM public.products WHERE sku = 'BBTEST-001');
DELETE FROM public.product_variants WHERE product_id IN (SELECT id FROM public.products WHERE sku = 'BBTEST-001');
DELETE FROM public.product_listings WHERE product_id IN (SELECT id FROM public.products WHERE sku = 'BBTEST-001');
DELETE FROM public.products WHERE sku = 'BBTEST-001';