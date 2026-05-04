
-- The bucket already has SELECT for public; tighten by dropping any over-broad list policy
DROP POLICY IF EXISTS "Anyone can view exercise media" ON storage.objects;
DROP POLICY IF EXISTS "Public read exercise-media" ON storage.objects;

CREATE POLICY "Authenticated can list exercise media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exercise-media');

CREATE POLICY "Public can read exercise media by url"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'exercise-media');

CREATE POLICY "Authenticated can upload exercise media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exercise-media');
