-- ==============================================================================
-- 20261019000003_rpc_functions_and_triggers.sql
-- PowerStar Platform v2 — Automation Triggers & Authoritative RPC Functions
-- ==============================================================================

-- 1. BOOKING DEFAULTS TRIGGER (Auto ref PS-XXXXX, 4-digit start/end OTP)
CREATE OR REPLACE FUNCTION public.set_booking_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.booking_ref IS NULL OR NEW.booking_ref = '' THEN
    NEW.booking_ref := 'PS-' || LPAD(FLOOR(RANDOM()*90000 + 10000)::TEXT, 5, '0');
  END IF;
  IF NEW.start_otp IS NULL OR NEW.start_otp = '' THEN
    NEW.start_otp := LPAD(FLOOR(RANDOM()*9000 + 1000)::TEXT, 4, '0');
  END IF;
  IF NEW.end_otp IS NULL OR NEW.end_otp = '' THEN
    NEW.end_otp := LPAD(FLOOR(RANDOM()*9000 + 1000)::TEXT, 4, '0');
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_defaults ON public.bookings;
CREATE TRIGGER trg_set_booking_defaults
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_defaults();

-- 2. PROVIDER RATING TRIGGER
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.providers SET
    rating        = (SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE provider_id = NEW.provider_id),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_provider_rating ON public.reviews;
CREATE TRIGGER trg_update_provider_rating
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_rating();

-- 3. AUTHORITATIVE PHONE REGISTRATION RPC (Bypasses RLS safely)
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

-- 4. CURRENT ROLE RPC HELPER
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'customer'::user_role);
$$;
