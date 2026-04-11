-- Create a private bucket for manual verification documents.
-- Files are stored under:
--   {profile_id}/{request_id}/front.ext
--   {profile_id}/{request_id}/back.ext

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'verification-docs',
  'verification-docs',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload own verification docs" ON storage.objects;
CREATE POLICY "Users can upload own verification docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can read own verification docs" ON storage.objects;
CREATE POLICY "Users can read own verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Admins can read all verification docs" ON storage.objects;
CREATE POLICY "Admins can read all verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);
