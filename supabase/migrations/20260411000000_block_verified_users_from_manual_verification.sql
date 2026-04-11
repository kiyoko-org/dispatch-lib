-- Block already-verified users from creating new manual verification requests.
-- Keep rejected users eligible to resubmit later.

DROP POLICY IF EXISTS "Users can insert own verification requests"
ON public.verification_requests;

CREATE POLICY "Users can insert own verification requests"
ON public.verification_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = profile_id
  AND status = 'pending'
  AND reviewed_at IS NULL
  AND reviewed_by IS NULL
  AND front_storage_path LIKE auth.uid()::text || '/%'
  AND (
    back_storage_path IS NULL
    OR back_storage_path LIKE auth.uid()::text || '/%'
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND COALESCE(p.is_verified, false) = false
  )
);
