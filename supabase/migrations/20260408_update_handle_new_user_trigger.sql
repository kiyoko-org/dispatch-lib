-- Update handle_new_user trigger to support minimal signup
-- Only creates profile with essential fields
-- Profile data will be filled later during profile completion

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    fcm_token,
    role,
    is_verified
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'fcm_token',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    -- Set is_verified based on role
    CASE 
      WHEN COALESCE(new.raw_user_meta_data->>'role', 'user') = 'admin' THEN NULL
      ELSE false  -- Regular users start as unverified
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger already exists, no need to recreate
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
