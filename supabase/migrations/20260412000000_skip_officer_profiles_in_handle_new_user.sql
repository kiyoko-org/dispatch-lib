-- Skip profile creation for officer auth users.
-- Officers should exist in public.officers, not public.profiles.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
DECLARE
  new_user_role TEXT := COALESCE(new.raw_user_meta_data->>'role', 'user');
BEGIN
  IF new_user_role = 'officer' THEN
    RETURN new;
  END IF;

  INSERT INTO public.profiles (
    id,
    fcm_token,
    role,
    is_verified
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'fcm_token',
    new_user_role::public.role,
    CASE
      WHEN new_user_role = 'admin' THEN NULL
      ELSE false
    END
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
