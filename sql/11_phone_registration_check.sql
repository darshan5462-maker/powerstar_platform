-- ============================================================
-- 11. Safe Phone Deduplication & Enforce 1 Number = 1 Account
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Detach phone numbers from duplicate profiles (set phone = NULL on duplicates)
-- This preserves all booking/payment history without triggering any foreign key errors!
WITH ranked_profiles AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY right(regexp_replace(COALESCE(phone, ''), '\D', '', 'g'), 10)
           ORDER BY id ASC
         ) as rn
  FROM public.profiles
  WHERE phone IS NOT NULL AND length(right(regexp_replace(phone, '\D', '', 'g'), 10)) = 10
)
UPDATE public.profiles p
SET phone = NULL
FROM ranked_profiles r
WHERE p.id = r.id AND r.rn > 1;

-- 2. Enforce strict UNIQUE constraint on 10-digit mobile number (1 number = 1 account ONLY)
DROP INDEX IF EXISTS idx_profiles_unique_clean_phone;
CREATE UNIQUE INDEX idx_profiles_unique_clean_phone
ON public.profiles (right(regexp_replace(COALESCE(phone, ''), '\D', '', 'g'), 10))
WHERE phone IS NOT NULL AND length(right(regexp_replace(phone, '\D', '', 'g'), 10)) = 10;

-- 3. Allow SELECT on profiles so registration status can be verified before sending OTP
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_allow_phone_lookup" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public_providers" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;

CREATE POLICY "profiles_read_all"
ON public.profiles FOR SELECT
USING (true);

-- 4. Create secure SECURITY DEFINER RPC function to check if phone exists
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
  clean_num := right(regexp_replace(COALESCE(check_phone, ''), '\D', '', 'g'), 10);

  IF clean_num IS NULL OR length(clean_num) < 10 THEN
    RETURN jsonb_build_object('registered', false);
  END IF;

  SELECT id, role, full_name, phone INTO found_profile
  FROM public.profiles
  WHERE phone IS NOT NULL
    AND right(regexp_replace(phone, '\D', '', 'g'), 10) = clean_num
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

GRANT EXECUTE ON FUNCTION public.check_phone_registered(text) TO anon, authenticated, service_role;
