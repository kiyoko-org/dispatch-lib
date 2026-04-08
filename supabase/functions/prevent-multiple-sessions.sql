DECLARE
  session_count INT;
BEGIN
  -- Count existing sessions for this user
  SELECT count(*) INTO session_count
  FROM auth.sessions
  WHERE user_id = NEW.user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );

  -- If a session already exists, prevent the new login
  IF session_count >= 1 THEN
    RAISE EXCEPTION 'User already has an active session. Please log out from the other device first.';
  END IF;

  -- Allow the insert if no existing session
  RETURN NEW;
END;
