-- ============================================================
-- 11. Allow Phone Number Lookup for Registration & Login Checks
-- ============================================================

-- 1. Create a secure SECURITY DEFINER function to check if a phone number exists
CREATE OR REPLACE FUNCTION public.check_phone_registered(check_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_num text;
  found_profile record;
BEGIN
  -- Extract last 10 digits to match any Indian phone format
  clean_num := right(regexp_replace(COALESCE(check_phone, ''), '\D', '', 'g'), 10);

  IF clean_num IS NULL OR length(clean_num) < 10 THEN
    RETURN jsonb_build_object('registered', false);
  END IF;

  SELECT id, role, full_name, phone INTO found_profile
  FROM public.profiles
  WHERE right(regexp_replace(COALESCE(phone, ''), '\D', '', 'g'), 10) = clean_num
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'registered', true,
      'id', found_profile.id,
      'role', found_profile.role,
      'full_name', found_profile.full_name
    );
  ELSE
    RETURN jsonb_build_object('registered', false);
  END IF;
END;
$$;

-- Grant execution to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.check_phone_registered(text) TO anon, authenticated, service_role;

-- 2. Allow SELECT policy for phone verification on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_allow_phone_lookup'
  ) THEN
    CREATE POLICY "profiles_allow_phone_lookup"
    ON public.profiles FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;
