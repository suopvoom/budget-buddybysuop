-- 1) Bootstrap admin then remove the SECURITY DEFINER self-claim RPC
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

DROP FUNCTION IF EXISTS public.claim_first_admin();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_price_drop() FROM PUBLIC, anon, authenticated;

-- 2) product_views: no more WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can log a view" ON public.product_views;
CREATE POLICY "Log own product view" ON public.product_views
FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NOT DISTINCT FROM auth.uid());

-- 3) storage: private bucket should not be world readable
DROP POLICY IF EXISTS "product-images read" ON storage.objects;
CREATE POLICY "product-images read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'product-images'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)));

-- 4) user_roles: own-role reads limited to signed-in users
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);