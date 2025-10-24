-- RPC function to check if an email exists in the auth.users table
-- Returns true when the supplied email matches an existing user (case-insensitive)
CREATE OR REPLACE FUNCTION email_exists(email_param TEXT)
RETURNS TABLE("exists" BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  normalized_email TEXT := NULLIF(TRIM(email_param), '');
BEGIN
  IF normalized_email IS NULL THEN
    RAISE EXCEPTION 'email parameter is required';
  END IF;

  RETURN QUERY
  SELECT (COUNT(*) > 0)::BOOLEAN
  FROM auth.users
  WHERE lower(email) = lower(normalized_email);
END;
$$;

-- Grant execute permission to anonymous users so clients can call this function.
GRANT EXECUTE ON FUNCTION email_exists(TEXT) TO anon;
