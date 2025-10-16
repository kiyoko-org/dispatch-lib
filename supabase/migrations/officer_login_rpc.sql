-- RPC function to get officer email by badge number
-- This function looks up an officer by badge number and returns their email from auth.users
CREATE OR REPLACE FUNCTION get_officer_email_by_badge(badge_number_param TEXT)
RETURNS TABLE(email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.email::TEXT
  FROM auth.users au
  INNER JOIN public.officers o ON au.id = o.id
  WHERE o.badge_number = badge_number_param
  AND au.raw_user_meta_data->>'role' = 'officer';
END;
$$;

-- Grant execute permission to anonymous users (needed for login)
GRANT EXECUTE ON FUNCTION get_officer_email_by_badge(TEXT) TO anon;
