/*
# Fix product-images bucket public read access

## Problem
A previous migration (20260808074952) tightened the storage read policy for the
`product-images` bucket to admin/editor only. This means signed-out visitors
and non-staff users cannot load product images on the home page, search, product
detail page, or wishlist — all of which display `image_url` / `image_gallery`
values pointing at that bucket.

## Changes
1. Storage policies on `storage.objects` for the `product-images` bucket:
   - SELECT: allow `anon` + `authenticated` (public read) — product images are
     promotional content meant to be visible to everyone.
   - INSERT / UPDATE / DELETE: keep admin/editor-only (no change to write side).
2. No table schema changes. No data changes. Write side remains locked down.

## Security notes
- Product images are public promotional assets (same as product names, prices,
  descriptions which are already publicly readable). Making the bucket
  world-readable aligns the storage layer with the existing RLS posture on the
  `products` table.
- Only the read policy changes; uploads/deletes still require admin/editor role.
*/

DROP POLICY IF EXISTS "product-images read" ON storage.objects;
CREATE POLICY "product-images read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product-images write" ON storage.objects;
CREATE POLICY "product-images write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));

DROP POLICY IF EXISTS "product-images update" ON storage.objects;
CREATE POLICY "product-images update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));

DROP POLICY IF EXISTS "product-images delete" ON storage.objects;
CREATE POLICY "product-images delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));