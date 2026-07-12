
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.marketplaces TO anon, authenticated;
GRANT SELECT ON public.product_listings TO anon, authenticated;
GRANT SELECT ON public.price_history TO anon, authenticated;
GRANT ALL ON public.products, public.brands, public.categories, public.marketplaces, public.product_listings, public.price_history TO service_role;
