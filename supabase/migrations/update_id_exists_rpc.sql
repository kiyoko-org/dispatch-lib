-- Updated RPC function to align id_exists behavior with email_exists
CREATE OR REPLACE FUNCTION id_exists(id_card_number_param TEXT)
RETURNS TABLE("exists" BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  normalized_id TEXT := NULLIF(TRIM(id_card_number_param), '');
BEGIN
  IF normalized_id IS NULL THEN
    RAISE EXCEPTION 'id_card_number parameter is required';
  END IF;

  RETURN QUERY
  SELECT (COUNT(*) > 0)::BOOLEAN
  FROM public.profiles
  WHERE id_card_number = normalized_id;
END;
$$;

GRANT EXECUTE ON FUNCTION id_exists(TEXT) TO anon;
