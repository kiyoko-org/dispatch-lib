-- Create enum + table for manual verification requests.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'verification_document_type'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.verification_document_type AS ENUM (
      'drivers_license',
      'passport',
      'postal_id',
      'umid',
      'other'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type public.verification_document_type NOT NULL,
  front_storage_path text NOT NULL,
  back_storage_path text NULL,
  status text NOT NULL DEFAULT 'pending',
  review_notes text NULL,
  reviewed_at timestamptz NULL,
  reviewed_by uuid NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

COMMENT ON TABLE public.verification_requests IS 'Manual identity verification submissions for non-PhilSys documents.';
COMMENT ON COLUMN public.verification_requests.front_storage_path IS 'Supabase Storage path inside verification-docs bucket.';
COMMENT ON COLUMN public.verification_requests.back_storage_path IS 'Optional back image/document path inside verification-docs bucket.';

GRANT USAGE ON TYPE public.verification_document_type TO authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.verification_requests TO authenticated;

CREATE INDEX IF NOT EXISTS verification_requests_profile_id_idx
  ON public.verification_requests(profile_id);

CREATE INDEX IF NOT EXISTS verification_requests_status_idx
  ON public.verification_requests(status);

CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_one_pending_per_profile_idx
  ON public.verification_requests(profile_id)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_verification_requests_updated_at
ON public.verification_requests;

CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

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
);

DROP POLICY IF EXISTS "Users can read own verification requests"
ON public.verification_requests;
CREATE POLICY "Users can read own verification requests"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = profile_id
);

DROP POLICY IF EXISTS "Admins can read all verification requests"
ON public.verification_requests;
CREATE POLICY "Admins can read all verification requests"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);
