-- Fix get_profiles_with_emails to match expected types and include trust scoring data
-- This function merges data from public.profiles and auth.users for the Admin Dashboard

CREATE OR REPLACE FUNCTION public.get_profiles_with_emails()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  badge_number TEXT,
  role TEXT,
  email TEXT,
  joined_date TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  reports_count BIGINT,
  trust_score SMALLINT,
  trust_factors JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name::TEXT,
    p.middle_name::TEXT,
    p.last_name::TEXT,
    p.avatar_url::TEXT,
    o.badge_number::TEXT,
    p.role::TEXT,
    u.email::TEXT,
    u.created_at as joined_date,
    u.last_sign_in_at,
    (SELECT count(*) FROM public.reports r WHERE r.reporter_id = p.id) as reports_count,
    p.trust_score,
    p.trust_factors
  FROM 
    public.profiles p
  LEFT JOIN 
    auth.users u ON p.id = u.id
  LEFT JOIN
    public.officers o ON p.id = o.id
  ORDER BY 
    u.created_at DESC;
END;
$$;

-- Grant execution to authenticated users (Admins)
GRANT EXECUTE ON FUNCTION public.get_profiles_with_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_with_emails() TO service_role;
