-- Convert manual verification status fields from text/check to Postgres enums.
-- This tightens DB validation and improves generated TypeScript types.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'verification_request_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.verification_request_status AS ENUM (
      'pending',
      'approved',
      'rejected'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'verification_review_decision'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.verification_review_decision AS ENUM (
      'approved',
      'rejected'
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can insert own verification requests"
ON public.verification_requests;

DROP INDEX IF EXISTS verification_requests_status_idx;
DROP INDEX IF EXISTS verification_requests_one_pending_per_profile_idx;

ALTER TABLE public.verification_requests
DROP CONSTRAINT IF EXISTS verification_requests_status_check;

ALTER TABLE public.verification_requests
ALTER COLUMN status DROP DEFAULT,
ALTER COLUMN status TYPE public.verification_request_status
USING status::public.verification_request_status,
ALTER COLUMN status SET DEFAULT 'pending'::public.verification_request_status;

CREATE INDEX IF NOT EXISTS verification_requests_status_idx
  ON public.verification_requests(status);

CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_one_pending_per_profile_idx
  ON public.verification_requests(profile_id)
  WHERE status = 'pending'::public.verification_request_status;

CREATE POLICY "Users can insert own verification requests"
ON public.verification_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = profile_id
  AND status = 'pending'::public.verification_request_status
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

DROP FUNCTION IF EXISTS public.review_verification_request(uuid, text, text);

CREATE OR REPLACE FUNCTION public.review_verification_request(
  request_id_param uuid,
  decision public.verification_review_decision,
  review_notes_param text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  document_type public.verification_document_type,
  front_storage_path text,
  back_storage_path text,
  status public.verification_request_status,
  review_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_id uuid := auth.uid();
  target_profile_id uuid;
BEGIN
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = admin_id
      AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can review verification requests';
  END IF;

  SELECT vr.profile_id
  INTO target_profile_id
  FROM public.verification_requests vr
  WHERE vr.id = request_id_param
    AND vr.status = 'pending'::public.verification_request_status;

  IF target_profile_id IS NULL THEN
    RAISE EXCEPTION 'Pending verification request not found';
  END IF;

  UPDATE public.verification_requests vr
  SET
    status = decision::text::public.verification_request_status,
    review_notes = review_notes_param,
    reviewed_at = now(),
    reviewed_by = admin_id,
    updated_at = now()
  WHERE vr.id = request_id_param
    AND vr.status = 'pending'::public.verification_request_status;

  IF decision = 'approved'::public.verification_review_decision THEN
    UPDATE public.profiles
    SET
      is_verified = true,
      updated_at = now()
    WHERE id = target_profile_id;
  ELSE
    UPDATE public.profiles
    SET
      is_verified = false,
      updated_at = now()
    WHERE id = target_profile_id
      AND COALESCE(is_verified, false) = false;
  END IF;

  RETURN QUERY
  SELECT
    vr.id,
    vr.profile_id,
    vr.document_type,
    vr.front_storage_path,
    vr.back_storage_path,
    vr.status,
    vr.review_notes,
    vr.reviewed_at,
    vr.reviewed_by,
    vr.created_at,
    vr.updated_at
  FROM public.verification_requests vr
  WHERE vr.id = request_id_param;
END;
$$;

REVOKE ALL ON FUNCTION public.review_verification_request(uuid, public.verification_review_decision, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_verification_request(uuid, public.verification_review_decision, text)
TO authenticated, service_role;
