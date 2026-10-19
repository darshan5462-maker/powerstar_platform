-- ==============================================================================
--  POWERSTAR PLATFORM v2 — MASTER DATABASE SCHEMA & MIGRATIONS FROM SCRATCH
--  Run this ENTIRE file in:
--  Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ==============================================================================

-- ── 1. POSTGRES EXTENSIONS ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. ENUMS (Safely Created) ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('pending', 'submitted', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending_admin',
    'provider_assigned',
    'payment_pending',
    'payment_success',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'rejected',
    'payment_failed',
    'pending',
    'accepted',
    'active'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'success',
    'failed',
    'cancelled',
    'held',
    'released',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM ('manpower', 'vehicle', 'rto', 'financial');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── 3. PROFILES TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role        user_role NOT NULL DEFAULT 'customer',
  full_name   TEXT NOT NULL DEFAULT 'Customer',
  phone       TEXT,
  avatar_url  TEXT,
  district    TEXT DEFAULT 'Bengaluru Urban',
  city        TEXT DEFAULT 'Bengaluru',
  address     TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deduplicate existing profiles by 10-digit mobile number before index creation
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

-- STRICT UNIQUE CONSTRAINT: 1 Mobile Number = 1 Account ONLY
DROP INDEX IF EXISTS idx_profiles_unique_clean_phone;
CREATE UNIQUE INDEX idx_profiles_unique_clean_phone
ON public.profiles (right(regexp_replace(COALESCE(phone, ''), '\D', '', 'g'), 10))
WHERE phone IS NOT NULL AND length(right(regexp_replace(phone, '\D', '', 'g'), 10)) = 10;

-- ── 4. SERVICE CATEGORIES TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  name_kn     TEXT,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  type        service_type NOT NULL,
  base_price  NUMERIC(10,2) NOT NULL DEFAULT 11,
  price_unit  TEXT DEFAULT '/hr',
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. PROVIDERS TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.providers (
  id               UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES public.service_categories(id),
  experience_years INTEGER NOT NULL DEFAULT 0,
  hourly_rate      NUMERIC(10,2) DEFAULT 280,
  bio              TEXT,
  skills_tags      TEXT[],
  service_radius   INTEGER NOT NULL DEFAULT 15,
  is_online        BOOLEAN NOT NULL DEFAULT false,
  kyc_status       kyc_status NOT NULL DEFAULT 'pending',
  rating           NUMERIC(3,2) NOT NULL DEFAULT 4.9,
  total_reviews    INTEGER NOT NULL DEFAULT 0,
  total_jobs       INTEGER NOT NULL DEFAULT 0,
  total_earnings   NUMERIC(12,2) NOT NULL DEFAULT 0,
  aadhaar_url      TEXT,
  selfie_url       TEXT,
  certificate_url  TEXT,
  bank_passbook_url TEXT,
  bank_account_no  TEXT,
  bank_ifsc        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. PROVIDER LOCATIONS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.provider_locations (
  provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  heading     DOUBLE PRECISION,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. BOOKINGS TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref     TEXT UNIQUE NOT NULL,
  customer_id     UUID NOT NULL REFERENCES public.profiles(id),
  provider_id     UUID REFERENCES public.providers(id),
  category_id     UUID REFERENCES public.service_categories(id),
  category_slug   TEXT,
  status          booking_status NOT NULL DEFAULT 'pending_admin',
  address         TEXT NOT NULL,
  city            TEXT NOT NULL,
  district        TEXT NOT NULL,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  scheduled_at    TIMESTAMPTZ,
  accepted_at     TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  base_amount     NUMERIC(10,2) NOT NULL DEFAULT 11,
  platform_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(10,2) NOT NULL DEFAULT 11,
  start_otp       TEXT,
  end_otp         TEXT,
  customer_notes  TEXT,
  cancellation_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. PAYMENTS TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id          UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES public.profiles(id),
  provider_id         UUID REFERENCES public.providers(id),
  amount              NUMERIC(10,2) NOT NULL DEFAULT 11,
  platform_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
  provider_payout     NUMERIC(10,2) NOT NULL DEFAULT 11,
  status              payment_status NOT NULL DEFAULT 'pending',
  method              TEXT NOT NULL DEFAULT 'upi',
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  upi_ref             TEXT,
  refund_amount       NUMERIC(10,2),
  refund_reason       TEXT,
  refunded_at         TIMESTAMPTZ,
  settled_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. REVIEWS TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 10. DISPUTES & NOTIFICATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.disputes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  raised_by   UUID NOT NULL REFERENCES public.profiles(id),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',
  outcome     TEXT,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL,
  data       JSONB,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 11. INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at  ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_providers_category   ON public.providers(category_id);
CREATE INDEX IF NOT EXISTS idx_providers_kyc        ON public.providers(kyc_status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id  ON public.payments(booking_id);

-- ── 12. AUTOMATED TRIGGERS ────────────────────────────────────────────────────
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

-- ── 13. SECURITY DEFINER RPC FUNCTIONS ────────────────────────────────────────
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

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'customer'::user_role);
$$;

-- ── 14. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings  ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;

CREATE POLICY "profiles_read_all"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_all" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_all" ON public.profiles FOR UPDATE USING (true);

-- Service Categories (Public view, Admin modify)
DROP POLICY IF EXISTS "categories_read_all" ON public.service_categories;
DROP POLICY IF EXISTS "categories_admin_all" ON public.service_categories;

CREATE POLICY "categories_read_all"  ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON public.service_categories FOR ALL USING (get_my_role() = 'admin');

-- Providers Policies
DROP POLICY IF EXISTS "providers_read_all" ON public.providers;
DROP POLICY IF EXISTS "providers_write_all" ON public.providers;

CREATE POLICY "providers_read_all"  ON public.providers FOR SELECT USING (true);
CREATE POLICY "providers_write_all" ON public.providers FOR ALL USING (true);

-- Bookings Policies
DROP POLICY IF EXISTS "bookings_read_all" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_all" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_all" ON public.bookings;

CREATE POLICY "bookings_read_all"   ON public.bookings FOR SELECT USING (true);
CREATE POLICY "bookings_insert_all" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_update_all" ON public.bookings FOR UPDATE USING (true);

-- Payments & Reviews Policies
DROP POLICY IF EXISTS "payments_all" ON public.payments;
CREATE POLICY "payments_all" ON public.payments FOR ALL USING (true);

DROP POLICY IF EXISTS "reviews_all" ON public.reviews;
CREATE POLICY "reviews_all" ON public.reviews FOR ALL USING (true);

DROP POLICY IF EXISTS "locations_all" ON public.provider_locations;
CREATE POLICY "locations_all" ON public.provider_locations FOR ALL USING (true);

DROP POLICY IF EXISTS "settings_read" ON public.platform_settings;
CREATE POLICY "settings_read" ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_admin" ON public.platform_settings;
CREATE POLICY "settings_admin" ON public.platform_settings FOR ALL USING (true);

-- ── 15. SEED ALL 42 SERVICE CATEGORIES & RATE CARDS ──────────────────────────
INSERT INTO public.service_categories (name, name_kn, slug, icon, type, base_price, price_unit, sort_order, description) VALUES
-- Manpower (20)
('Electrician', 'ವಿದ್ಯುತ್ ತಂತ್ರಜ್ಞ', 'electrician', '⚡', 'manpower', 280, '/hr', 1, 'Wiring, fans, switches, MCB, inverter installation'),
('Mason / Gowndi', 'ಮೇಸ್ತ್ರಿ', 'mason', '🧱', 'manpower', 350, '/hr', 2, 'Brick laying, plastering, concrete, RCC work'),
('Plumber', 'ನಲ್ಲಿ ಕೆಲಸ', 'plumber', '🔧', 'manpower', 260, '/hr', 3, 'Pipe fitting, leakage, tank cleaning, bathroom fitting'),
('Centring Worker', 'ಸೆಂಟ್ರಿಂಗ್', 'centring', '🏗️', 'manpower', 300, '/hr', 4, 'Formwork, shuttering for RCC slabs and beams'),
('Tile Worker', 'ಟೈಲ್ ಕೆಲಸ', 'tile-worker', '🪣', 'manpower', 290, '/hr', 5, 'Floor & wall tile fixing, marble, granite work'),
('Construction Worker', 'ಕಟ್ಟಡ ಕಾರ್ಮಿಕ', 'construction', '👷', 'manpower', 250, '/hr', 6, 'Concrete mixing, material carrying, site support'),
('Home Cleaning', 'ಮನೆ ಸ್ವಚ್ಛತೆ', 'cleaning', '🧹', 'manpower', 200, '/hr', 7, 'Deep cleaning, bathroom, kitchen, sofa cleaning'),
('Home Shifting', 'ಮನೆ ಸ್ಥಳಾಂತರ', 'shifting', '📦', 'manpower', 1200, '/job', 8, 'Packing, loading, transport & unloading'),
('Ground Work Labor', 'ಮಣ್ಣಿನ ಕೆಲಸ', 'groundwork', '🌱', 'manpower', 240, '/hr', 9, 'Digging, levelling, trench, foundation work'),
('Driver', 'ಚಾಲಕ', 'driver', '🚗', 'manpower', 350, '/hr', 10, 'Licensed LMV/HMV driver for personal or commercial'),
('Helper', 'ಸಹಾಯಕ', 'helper', '🤝', 'manpower', 180, '/hr', 11, 'General helper for any work'),
('Loading / Unloading', 'ಲೋಡಿಂಗ್', 'loading', '💪', 'manpower', 200, '/hr', 12, 'Loading goods from trucks, containers, warehouses'),
('Hospital Helper', 'ಆಸ್ಪತ್ರೆ ಸಹಾಯ', 'hospital', '🏥', 'manpower', 220, '/hr', 13, 'Patient attendant, ward boy, stretcher bearer'),
('Garment Worker', 'ಉಡುಪು ಕೆಲಸ', 'garment', '🪡', 'manpower', 190, '/hr', 14, 'Stitching, fabric cutting, tailoring'),
('Hotel Staff', 'ಹೋಟೆಲ್ ಸಿಬ್ಬಂದಿ', 'hotel', '🏨', 'manpower', 200, '/hr', 15, 'Waiter, cook helper, housekeeping'),
('Office Worker', 'ಕಚೇರಿ ಕೆಲಸ', 'office', '🏢', 'manpower', 220, '/hr', 16, 'Office boy, peon, data entry support'),
('Financial Worker', 'ಹಣಕಾಸು', 'financial-worker', '🏦', 'manpower', 300, '/hr', 17, 'Loan recovery, field collection, banking support'),
('Agricultural Worker', 'ಕೃಷಿ ಕಾರ್ಮಿಕ', 'agriculture', '🌾', 'manpower', 220, '/hr', 18, 'Harvesting, planting, irrigation, farm work'),
('Delivery Worker', 'ಡೆಲಿವರಿ', 'delivery', '📬', 'manpower', 180, '/hr', 19, 'Local parcel, courier, document delivery'),
('Security Guard', 'ಭದ್ರತಾ ಸಿಬ್ಬಂದಿ', 'security', '🛡️', 'manpower', 240, '/hr', 20, 'Site, building, event security'),
-- Vehicles (13)
('Tata Ace', 'ಟಾಟಾ ಏಸ್', 'tata-ace', '🚐', 'vehicle', 899, '/trip', 21, 'Mini truck for light goods (750 kg)'),
('Bolero Pickup', 'ಬೊಲೆರೊ', 'bolero', '🛻', 'vehicle', 1299, '/trip', 22, 'Medium pickup for construction material (1.2 ton)'),
('Tata Intra', 'ಟಾಟಾ ಇಂಟ್ರಾ', 'tata-intra', '🚐', 'vehicle', 1099, '/trip', 23, 'City logistics and last-mile delivery (1 ton)'),
('407 Truck', '407 ಟ್ರಕ್', 'truck-407', '🚛', 'vehicle', 2199, '/trip', 24, 'Inter-city goods & furniture transport (2.5 ton)'),
('Lorry', 'ಲಾರಿ', 'lorry', '🚚', 'vehicle', 3500, '/trip', 25, 'Heavy lorry for bulk goods (5–9 ton)'),
('Tempo', 'ಟೆಂಪೋ', 'tempo', '🚌', 'vehicle', 1499, '/trip', 26, 'Medium goods van for city transport (1.5 ton)'),
('Tractor', 'ಟ್ರ್ಯಾಕ್ಟರ್', 'tractor', '🚜', 'vehicle', 2800, '/day', 27, 'Farm tractor for agricultural & site work'),
('JCB Excavator', 'ಜೆಸಿಬಿ', 'jcb', '🏗️', 'vehicle', 4500, '/day', 28, 'Backhoe loader for digging & demolition'),
('Hitachi Excavator', 'ಹಿಟಾಚಿ', 'hitachi', '⛏️', 'vehicle', 4800, '/day', 29, 'Heavy excavator for deep digging & mining'),
('Crane', 'ಕ್ರೇನ್', 'crane', '🏗️', 'vehicle', 8000, '/day', 30, 'Mobile crane for heavy lifting (10–50 ton)'),
('Water Tanker', 'ನೀರಿನ ಟ್ಯಾಂಕರ್', 'tanker', '🚰', 'vehicle', 1800, '/trip', 31, 'Water supply for sites & farms (8,000 L)'),
('Auto Riksha', 'ಆಟೋ', 'auto', '🛺', 'vehicle', 349, '/trip', 32, 'Three-wheeler for small parcel delivery'),
('3-Wheeler Riksha', 'ರಿಕ್ಷಾ', 'riksha', '🛺', 'vehicle', 299, '/trip', 33, 'Electric/petrol 3-wheeler hyper-local delivery'),
-- RTO (5)
('Vehicle Insurance', 'ವಾಹನ ವಿಮೆ', 'insurance', '🛡️', 'rto', 500, '/svc', 34, 'New, renewal & comprehensive insurance'),
('PUC Certificate', 'ಪಿಯುಸಿ', 'puc', '📋', 'rto', 200, '/svc', 35, 'Pollution Under Control certificate'),
('Driving License', 'ಚಾಲನಾ ಪರವಾನಗಿ', 'dl', '🪪', 'rto', 800, '/svc', 36, 'New DL, renewal, duplicate, category addition'),
('Vehicle Passing', 'ವಾಹನ ಫಿಟ್ನೆಸ್', 'passing', '✅', 'rto', 600, '/svc', 37, 'Fitness certificate & registration renewal'),
('GPS Installation', 'ಜಿಪಿಎಸ್', 'gps', '📍', 'rto', 1200, '/svc', 38, 'AIS140 GPS for commercial vehicles'),
-- Financial (4)
('Vehicle Loan', 'ವಾಹನ ಸಾಲ', 'vehicle-loan', '🚗', 'financial', 0, '/svc', 39, 'New & used vehicle financing'),
('Insurance Loan', 'ವಿಮಾ ಸಾಲ', 'insurance-loan', '📄', 'financial', 0, '/svc', 40, 'Loan against LIC policy'),
('Tyre Loan', 'ಟೈರ್ ಸಾಲ', 'tyre-loan', '⭕', 'financial', 0, '/svc', 41, 'Easy EMI tyre purchase for commercial vehicles'),
('Personal Loan', 'ವೈಯಕ್ತಿಕ ಸಾಲ', 'personal-loan', '💰', 'financial', 0, '/svc', 42, 'Instant personal loans for all workers')
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  name_kn     = EXCLUDED.name_kn,
  icon        = EXCLUDED.icon,
  type        = EXCLUDED.type,
  base_price  = EXCLUDED.base_price,
  price_unit  = EXCLUDED.price_unit,
  description = EXCLUDED.description;

-- ── 16. SEED DEFAULT PLATFORM SETTINGS ───────────────────────────────────────
INSERT INTO public.platform_settings (key, value) VALUES
  ('admin_upi_id', 'powerstar@upi'),
  ('admin_upi_name', 'Powerstar Services'),
  ('platform_fee_percent', '0'),
  ('gst_percent', '0'),
  ('nominal_token_rate', '11'),
  ('support_phone', '+91 80 4567 8900'),
  ('support_email', 'support@powerstar.in')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;

-- ── 17. ENABLE REALTIME SYNC ──────────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_locations;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- ==============================================================================
-- SETUP COMPLETE: Database is fully initialized, indexed, and ready for production!
-- ==============================================================================
