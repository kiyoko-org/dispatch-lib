-- RPC function to check if an ID card number exists in profiles table
-- This function checks if an id_card_number is already registered with a user
CREATE OR REPLACE FUNCTION id_exists(id_card_number_param TEXT)
RETURNS TABLE("exists" BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT (COUNT(*) > 0)::BOOLEAN
  FROM public.profiles
  WHERE id_card_number = id_card_number_param;
END;
$$;

-- Grant execute permission to anonymous users (accessible by anyone)
GRANT EXECUTE ON FUNCTION id_exists(TEXT) TO anon;
