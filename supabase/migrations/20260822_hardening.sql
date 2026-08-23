-- POWERSTAR hardening migration
-- Safe to run against the existing project. It does not drop, truncate, or reset data.

CREATE TABLE IF NOT EXISTS provider_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id),
  hourly_rate NUMERIC(10,2) NOT NULL CHECK (hourly_rate >= 0),
  experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, category_id)
);

CREATE TABLE IF NOT EXISTS customer_locations (
  booking_id UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON provider_services(provider_id, is_active);
CREATE INDEX IF NOT EXISTS idx_customer_locations_customer ON customer_locations(customer_id);

ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_locations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_services' AND policyname='provider_services_owner_read') THEN
    CREATE POLICY provider_services_owner_read ON provider_services FOR SELECT
      USING (provider_id = auth.uid() OR get_my_role() = 'admin' OR is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_services' AND policyname='provider_services_owner_write') THEN
    CREATE POLICY provider_services_owner_write ON provider_services FOR ALL
      USING (provider_id = auth.uid() OR get_my_role() = 'admin')
      WITH CHECK (provider_id = auth.uid() OR get_my_role() = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customer_locations' AND policyname='customer_locations_owner_read') THEN
    CREATE POLICY customer_locations_owner_read ON customer_locations FOR SELECT
      USING (
        customer_id = auth.uid()
        OR get_my_role() = 'admin'
        OR EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.provider_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customer_locations' AND policyname='customer_locations_customer_write') THEN
    CREATE POLICY customer_locations_customer_write ON customer_locations FOR INSERT
      WITH CHECK (customer_id = auth.uid() AND EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid()));
    CREATE POLICY customer_locations_customer_update ON customer_locations FOR UPDATE
      USING (customer_id = auth.uid())
      WITH CHECK (customer_id = auth.uid());
  END IF;
END $$;

-- Prevent non-admin clients from changing privileged identity fields.
CREATE OR REPLACE FUNCTION protect_profile_privileged_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() = OLD.id AND get_my_role() <> 'admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Only an administrator can change role or activation state';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields_trigger ON profiles;
CREATE TRIGGER protect_profile_privileged_fields_trigger
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_privileged_fields();

-- Restrict customer-created bookings to pending state and verified/online providers.
CREATE OR REPLACE FUNCTION is_verified_online_provider(candidate UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM providers
    WHERE id = candidate AND kyc_status = 'verified' AND is_online = true
  );
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='booking_customer_insert_safe') THEN
    CREATE POLICY booking_customer_insert_safe ON bookings FOR INSERT
      WITH CHECK (
        customer_id = auth.uid()
        AND status = 'pending'
        AND (provider_id IS NULL OR is_verified_online_provider(provider_id))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='booking_customer_cancel') THEN
    CREATE POLICY booking_customer_cancel ON bookings FOR UPDATE
      USING (customer_id = auth.uid() AND status = 'pending')
      WITH CHECK (customer_id = auth.uid() AND status = 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='booking_provider_decline') THEN
    CREATE POLICY booking_provider_decline ON bookings FOR UPDATE
      USING (
        get_my_role() = 'provider'
        AND status = 'pending'
        AND district = (SELECT district FROM profiles WHERE id = auth.uid())
      )
      WITH CHECK (
        provider_id = auth.uid()
        AND status = 'cancelled'
        AND cancellation_reason = 'Declined by provider'
      );
  END IF;
END $$;

-- Keep financial and identity fields immutable to normal customer/provider updates.
CREATE OR REPLACE FUNCTION protect_booking_immutable_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF get_my_role() IN ('customer', 'provider') THEN
    IF NEW.customer_id IS DISTINCT FROM OLD.customer_id
      OR NEW.category_id IS DISTINCT FROM OLD.category_id
      OR NEW.base_amount IS DISTINCT FROM OLD.base_amount
      OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
      OR NEW.gst_amount IS DISTINCT FROM OLD.gst_amount
      OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
      OR (get_my_role() = 'customer' AND NEW.provider_id IS DISTINCT FROM OLD.provider_id) THEN
      RAISE EXCEPTION 'Booking identity and amount fields cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_booking_immutable_fields_trigger ON bookings;
CREATE TRIGGER protect_booking_immutable_fields_trigger
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION protect_booking_immutable_fields();

-- Provider notifications are generated server-side after a customer booking is created.
CREATE OR REPLACE FUNCTION notify_provider_on_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE customer_name TEXT;
BEGIN
  IF NEW.provider_id IS NOT NULL THEN
    SELECT full_name INTO customer_name FROM profiles WHERE id = NEW.customer_id;
    INSERT INTO notifications (user_id, title, body, type, data)
    VALUES (
      NEW.provider_id,
      'New job request',
      COALESCE(customer_name, 'A customer') || ' needs a service in ' || NEW.district || '.',
      'booking',
      jsonb_build_object('booking_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_provider_on_booking_trigger ON bookings;
CREATE TRIGGER notify_provider_on_booking_trigger
  AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION notify_provider_on_booking();

-- Create a payment row for every booking without requiring a client-side privileged insert.
CREATE OR REPLACE FUNCTION create_payment_for_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO payments (booking_id, customer_id, provider_id, amount, platform_fee, provider_payout, status)
  VALUES (NEW.id, NEW.customer_id, NEW.provider_id, NEW.total_amount, NEW.platform_fee, GREATEST(NEW.total_amount - NEW.platform_fee, 0), 'pending')
  ON CONFLICT (booking_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_payment_for_booking_trigger ON bookings;
CREATE TRIGGER create_payment_for_booking_trigger
  AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION create_payment_for_booking();

CREATE OR REPLACE FUNCTION mark_payment_held(p_booking_id UUID, p_payment_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM payments
    WHERE booking_id = p_booking_id AND customer_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Payment is not owned by the signed-in customer';
  END IF;
  UPDATE payments
  SET status = 'held', razorpay_payment_id = p_payment_id
  WHERE booking_id = p_booking_id AND customer_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION mark_payment_held(UUID, TEXT) TO authenticated;

-- Expose only directory-safe fields to customers and anonymous visitors.
CREATE OR REPLACE VIEW public_provider_directory AS
SELECT
  p.id,
  p.kyc_status,
  p.is_online,
  p.hourly_rate,
  p.rating,
  p.total_jobs,
  p.experience_years,
  pr.full_name,
  pr.district,
  pr.city,
  sc.name AS category_name,
  sc.icon AS category_icon,
  sc.slug AS category_slug,
  sc.base_price,
  sc.price_unit
FROM providers p
JOIN profiles pr ON pr.id = p.id
LEFT JOIN service_categories sc ON sc.id = p.category_id
WHERE p.kyc_status = 'verified' AND p.is_online = true AND pr.is_active = true;

GRANT SELECT ON public_provider_directory TO anon, authenticated;
DROP POLICY IF EXISTS public_verified ON providers;
