-- ============================================================
-- 11. Safe Deduplication, Reassign Bookings & Enforce Unique Phone
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Safely reassign bookings/payments to primary profile and remove duplicate phones
DO $$
DECLARE
  phone_rec RECORD;
  keep_id UUID;
  dup_rec RECORD;
BEGIN
  -- Loop through every 10-digit phone number that has more than 1 profile
  FOR phone_rec IN
    SELECT right(regexp_replace(COALESCE(phone, ''), '\D', '', 'g'), 10) as clean_phone
    FROM public.profiles
    WHERE phone IS NOT NULL AND length(right(regexp_replace(phone, '\D', '', 'g'), 10)) = 10
    GROUP BY right(regexp_replace(COALESCE(phone, ''), '\D', '', 'g'), 10)
    HAVING COUNT(*) > 1
  LOOP
    -- Pick the primary profile to KEEP (prioritize profile with existing bookings or oldest created)
    SELECT p.id INTO keep_id
    FROM public.profiles p
    LEFT JOIN (SELECT customer_id, COUNT(*) as b_cnt FROM public.bookings GROUP BY customer_id) b ON b.customer_id = p.id
    WHERE right(regexp_replace(COALESCE(p.phone, ''), '\D', '', 'g'), 10) = phone_rec.clean_phone
    ORDER BY COALESCE(b.b_cnt, 0) DESC, p.created_at ASC, p.id ASC
    LIMIT 1;

    -- Reassign all references from duplicates to keep_id, then delete duplicate
    FOR dup_rec IN
      SELECT id FROM public.profiles
      WHERE right(regexp_replace(COALESCE(phone, ''), '\D', '', 'g'), 10) = phone_rec.clean_phone
        AND id <> keep_id
    LOOP
      -- Safely reassign customer and provider foreign keys in bookings
      UPDATE public.bookings SET customer_id = keep_id WHERE customer_id = dup_rec.id;
      UPDATE public.bookings SET provider_id = keep_id WHERE provider_id = dup_rec.id;

      -- Safely reassign customer and provider foreign keys in payments
      UPDATE public.payments SET customer_id = keep_id WHERE customer_id = dup_rec.id;
      UPDATE public.payments SET provider_id = keep_id WHERE provider_id = dup_rec.id;

      -- Safely reassign reviews, disputes, notifications
      UPDATE public.reviews SET customer_id = keep_id WHERE customer_id = dup_rec.id;
      UPDATE public.disputes SET raised_by = keep_id WHERE raised_by = dup_rec.id;
      UPDATE public.notifications SET user_id = keep_id WHERE user_id = dup_rec.id;

      -- Delete providers record if any attached to the duplicate
      BEGIN
        DELETE FROM public.providers WHERE id = dup_rec.id;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;

      -- Delete the duplicate profile now that foreign keys are reassigned
      BEGIN
        DELETE FROM public.profiles WHERE id = dup_rec.id;
      EXCEPTION WHEN OTHERS THEN
        -- If still referenced by any custom constraint, remove phone so it never duplicates
        UPDATE public.profiles SET phone = NULL, is_active = false WHERE id = dup_rec.id;
      END;
    END LOOP;
  END LOOP;
END $$;

-- 2. Enforce UNIQUE constraint on 10-digit mobile number (1 number = 1 account ONLY)
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

GRANT EXECUTE ON FUNCTION public.check_phone_registered(text) TO anon, authenticated, service_role;
