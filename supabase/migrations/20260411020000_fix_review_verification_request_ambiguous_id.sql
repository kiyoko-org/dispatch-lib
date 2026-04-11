-- Fix ambiguous column reference inside review_verification_request().
-- The RETURNS TABLE output column `id` can clash with unqualified `id`
-- references in PL/pgSQL statements.

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
    WHERE public.profiles.id = target_profile_id;
  ELSE
    UPDATE public.profiles
    SET
      is_verified = false,
      updated_at = now()
    WHERE public.profiles.id = target_profile_id
      AND COALESCE(public.profiles.is_verified, false) = false;
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
