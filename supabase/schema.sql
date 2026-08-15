-- ================================================================
--  POWERSTAR v2 — Complete Supabase Database Schema
--  Run this ENTIRE file in:
--  Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ──────────────────────────────────────────────────────
CREATE TYPE user_role      AS ENUM ('customer','provider','admin');
CREATE TYPE kyc_status     AS ENUM ('pending','submitted','verified','rejected');
CREATE TYPE booking_status AS ENUM ('pending','accepted','active','completed','cancelled');
CREATE TYPE payment_status AS ENUM ('pending','held','released','refunded','failed');
CREATE TYPE service_type   AS ENUM ('manpower','vehicle','rto','financial');

-- ── 1. PROFILES ────────────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role   NOT NULL DEFAULT 'customer',
  full_name   TEXT        NOT NULL DEFAULT 'User',
  phone       TEXT,
  avatar_url  TEXT,
  district    TEXT,
  city        TEXT,
  address     TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, phone, district)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'district'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. SERVICE CATEGORIES ───────────────────────────────────────
CREATE TABLE service_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  name_kn     TEXT,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  type        service_type NOT NULL,
  base_price  NUMERIC(10,2),
  price_unit  TEXT,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed all 37 service categories
INSERT INTO service_categories (name, name_kn, slug, icon, type, base_price, price_unit, sort_order) VALUES
-- Manpower (20)
('Electrician','ವಿದ್ಯುತ್ ತಂತ್ರಜ್ಞ','electrician','⚡','manpower',280,'/hr',1),
('Mason / Gowndi','ಮೇಸ್ತ್ರಿ','mason','🧱','manpower',350,'/hr',2),
('Plumber','ನಲ್ಲಿ ಕೆಲಸ','plumber','🔧','manpower',260,'/hr',3),
('Centring Worker','ಸೆಂಟ್ರಿಂಗ್','centring','🏗️','manpower',300,'/hr',4),
('Tile Worker','ಟೈಲ್ ಕೆಲಸ','tile-worker','🪣','manpower',290,'/hr',5),
('Construction Worker','ಕಟ್ಟಡ ಕಾರ್ಮಿಕ','construction','👷','manpower',250,'/hr',6),
('Home Cleaning','ಮನೆ ಸ್ವಚ್ಛತೆ','cleaning','🧹','manpower',200,'/hr',7),
('Home Shifting','ಮನೆ ಸ್ಥಳಾಂತರ','shifting','📦','manpower',1200,'/job',8),
('Ground Work Labor','ಮಣ್ಣಿನ ಕೆಲಸ','groundwork','🌱','manpower',240,'/hr',9),
('Driver','ಚಾಲಕ','driver','🚗','manpower',350,'/hr',10),
('Helper','ಸಹಾಯಕ','helper','🤝','manpower',180,'/hr',11),
('Loading / Unloading','ಲೋಡಿಂಗ್','loading','💪','manpower',200,'/hr',12),
('Hospital Helper','ಆಸ್ಪತ್ರೆ ಸಹಾಯ','hospital','🏥','manpower',220,'/hr',13),
('Garment Worker','ಉಡುಪು ಕೆಲಸ','garment','🪡','manpower',190,'/hr',14),
('Hotel Staff','ಹೋಟೆಲ್ ಸಿಬ್ಬಂದಿ','hotel','🏨','manpower',200,'/hr',15),
('Office Worker','ಕಚೇರಿ ಕೆಲಸ','office','🏢','manpower',220,'/hr',16),
('Financial Worker','ಹಣಕಾಸು','financial-worker','🏦','manpower',300,'/hr',17),
('Agricultural Worker','ಕೃಷಿ ಕಾರ್ಮಿಕ','agriculture','🌾','manpower',220,'/hr',18),
('Delivery Worker','ಡೆಲಿವರಿ','delivery','📬','manpower',180,'/hr',19),
('Security Guard','ಭದ್ರತಾ ಸಿಬ್ಬಂದಿ','security','🛡️','manpower',240,'/hr',20),
-- Vehicles (13)
('Tata Ace','ಟಾಟಾ ಏಸ್','tata-ace','🚐','vehicle',899,'/trip',21),
('Bolero Pickup','ಬೊಲೆರೊ','bolero','🛻','vehicle',1299,'/trip',22),
('Tata Intra','ಟಾಟಾ ಇಂಟ್ರಾ','tata-intra','🚐','vehicle',1099,'/trip',23),
('407 Truck','407 ಟ್ರಕ್','truck-407','🚛','vehicle',2199,'/trip',24),
('Lorry','ಲಾರಿ','lorry','🚚','vehicle',3500,'/trip',25),
('Tempo','ಟೆಂಪೋ','tempo','🚌','vehicle',1499,'/trip',26),
('Tractor','ಟ್ರ್ಯಾಕ್ಟರ್','tractor','🚜','vehicle',2800,'/day',27),
('JCB Excavator','ಜೆಸಿಬಿ','jcb','🏗️','vehicle',4500,'/day',28),
('Hitachi Excavator','ಹಿಟಾಚಿ','hitachi','⛏️','vehicle',4800,'/day',29),
('Crane','ಕ್ರೇನ್','crane','🏗️','vehicle',8000,'/day',30),
('Water Tanker','ನೀರಿನ ಟ್ಯಾಂಕರ್','tanker','🚰','vehicle',1800,'/trip',31),
('Auto Riksha','ಆಟೋ','auto','🛺','vehicle',349,'/trip',32),
('3-Wheeler Riksha','ರಿಕ್ಷಾ','riksha','🛺','vehicle',299,'/trip',33),
-- RTO (5)
('Vehicle Insurance','ವಾಹನ ವಿಮೆ','insurance','🛡️','rto',500,'/svc',34),
('PUC Certificate','ಪಿಯುಸಿ','puc','📋','rto',200,'/svc',35),
('Driving License','ಚಾಲನಾ ಪರವಾನಗಿ','driving-license','🪪','rto',800,'/svc',36),
('Vehicle Passing','ವಾಹನ ಫಿಟ್ನೆಸ್','vehicle-passing','✅','rto',600,'/svc',37),
('GPS Installation','ಜಿಪಿಎಸ್','gps','📍','rto',1200,'/svc',38),
-- Financial (4)
('Vehicle Loan','ವಾಹನ ಸಾಲ','vehicle-loan','🚗','financial',0,'/svc',39),
('Insurance Loan','ವಿಮಾ ಸಾಲ','insurance-loan','📄','financial',0,'/svc',40),
('Tyre Loan','ಟೈರ್ ಸಾಲ','tyre-loan','⭕','financial',0,'/svc',41),
('Personal Loan','ವೈಯಕ್ತಿಕ ಸಾಲ','personal-loan','💰','financial',0,'/svc',42);

-- ── 3. PROVIDERS ───────────────────────────────────────────────
CREATE TABLE providers (
  id               UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES service_categories(id),
  experience_years INTEGER NOT NULL DEFAULT 0,
  hourly_rate      NUMERIC(10,2),
  bio              TEXT,
  skills_tags      TEXT[],
  service_radius   INTEGER NOT NULL DEFAULT 10,
  is_online        BOOLEAN NOT NULL DEFAULT false,
  kyc_status       kyc_status NOT NULL DEFAULT 'pending',
  rating           NUMERIC(3,2) NOT NULL DEFAULT 0,
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

-- ── 4. PROVIDER LIVE LOCATION ──────────────────────────────────
CREATE TABLE provider_locations (
  provider_id UUID PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  heading     DOUBLE PRECISION,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. BOOKINGS ────────────────────────────────────────────────
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref     TEXT UNIQUE NOT NULL,
  customer_id     UUID NOT NULL REFERENCES profiles(id),
  provider_id     UUID REFERENCES providers(id),
  category_id     UUID NOT NULL REFERENCES service_categories(id),
  status          booking_status NOT NULL DEFAULT 'pending',
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
  base_amount     NUMERIC(10,2) NOT NULL,
  platform_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(10,2) NOT NULL,
  start_otp       TEXT,
  end_otp         TEXT,
  customer_notes  TEXT,
  cancellation_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto booking ref + OTP
CREATE OR REPLACE FUNCTION set_booking_ref()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.booking_ref := 'PS-' || LPAD(FLOOR(RANDOM()*99999)::TEXT, 5, '0');
  NEW.start_otp   := LPAD(FLOOR(RANDOM()*9999)::TEXT, 4, '0');
  NEW.end_otp     := LPAD(FLOOR(RANDOM()*9999)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_booking_defaults
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_booking_ref();

-- ── 6. PAYMENTS ────────────────────────────────────────────────
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id          UUID NOT NULL UNIQUE REFERENCES bookings(id),
  customer_id         UUID NOT NULL REFERENCES profiles(id),
  provider_id         UUID REFERENCES providers(id),
  amount              NUMERIC(10,2) NOT NULL,
  platform_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
  provider_payout     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status              payment_status NOT NULL DEFAULT 'pending',
  method              TEXT NOT NULL DEFAULT 'upi',
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  refund_amount       NUMERIC(10,2),
  refund_reason       TEXT,
  refunded_at         TIMESTAMPTZ,
  settled_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. REVIEWS ─────────────────────────────────────────────────
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL UNIQUE REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update provider rating
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE providers SET
    rating        = (SELECT ROUND(AVG(rating)::numeric,2) FROM reviews WHERE provider_id=NEW.provider_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE provider_id=NEW.provider_id)
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- ── 8. DISPUTES ────────────────────────────────────────────────
CREATE TABLE disputes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES bookings(id),
  raised_by   UUID NOT NULL REFERENCES profiles(id),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',
  outcome     TEXT,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL,
  data       JSONB,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 10. PLATFORM SETTINGS ──────────────────────────────────────
CREATE TABLE platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (key, value) VALUES
  ('platform_fee_percent','5'),
  ('gst_percent','18'),
  ('settlement_hours','24'),
  ('support_phone','+91 80 4567 8900'),
  ('support_email','support@powerstar.in'),
  ('min_booking_amount','100');

-- ── INDEXES ────────────────────────────────────────────────────
CREATE INDEX idx_bookings_customer    ON bookings(customer_id);
CREATE INDEX idx_bookings_provider    ON bookings(provider_id);
CREATE INDEX idx_bookings_status      ON bookings(status);
CREATE INDEX idx_bookings_district    ON bookings(district);
CREATE INDEX idx_bookings_created     ON bookings(created_at DESC);
CREATE INDEX idx_providers_category   ON providers(category_id);
CREATE INDEX idx_providers_online     ON providers(is_online) WHERE is_online=true;
CREATE INDEX idx_providers_kyc        ON providers(kyc_status);
CREATE INDEX idx_notifications_user   ON notifications(user_id, is_read);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Profiles
CREATE POLICY "own_read"   ON profiles FOR SELECT USING (id=auth.uid() OR get_my_role()='admin');
CREATE POLICY "own_update" ON profiles FOR UPDATE USING (id=auth.uid());
CREATE POLICY "own_insert" ON profiles FOR INSERT WITH CHECK (id=auth.uid());

-- Service categories (public read)
CREATE POLICY "public_read"  ON service_categories FOR SELECT USING (true);
CREATE POLICY "admin_write"  ON service_categories FOR ALL USING (get_my_role()='admin');

-- Providers
CREATE POLICY "provider_own"    ON providers FOR SELECT USING (id=auth.uid() OR get_my_role()='admin');
CREATE POLICY "provider_update" ON providers FOR UPDATE USING (id=auth.uid());
CREATE POLICY "provider_insert" ON providers FOR INSERT WITH CHECK (id=auth.uid());
CREATE POLICY "public_verified" ON providers FOR SELECT USING (kyc_status='verified');

-- Provider locations
CREATE POLICY "locations_read"  ON provider_locations FOR SELECT USING (true);
CREATE POLICY "locations_write" ON provider_locations FOR ALL USING (provider_id=auth.uid());

-- Bookings
CREATE POLICY "booking_customer" ON bookings FOR SELECT USING (customer_id=auth.uid());
CREATE POLICY "booking_provider" ON bookings FOR SELECT USING (provider_id=auth.uid());
CREATE POLICY "booking_insert"   ON bookings FOR INSERT WITH CHECK (customer_id=auth.uid());
CREATE POLICY "booking_update_p" ON bookings FOR UPDATE USING (provider_id=auth.uid());
CREATE POLICY "booking_admin"    ON bookings FOR ALL USING (get_my_role()='admin');

-- Payments
CREATE POLICY "pay_customer" ON payments FOR SELECT USING (customer_id=auth.uid());
CREATE POLICY "pay_provider" ON payments FOR SELECT USING (provider_id=auth.uid());
CREATE POLICY "pay_admin"    ON payments FOR ALL   USING (get_my_role()='admin');

-- Reviews
CREATE POLICY "reviews_public"  ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert"  ON reviews FOR INSERT WITH CHECK (customer_id=auth.uid());
CREATE POLICY "reviews_admin"   ON reviews FOR ALL USING (get_my_role()='admin');

-- Disputes
CREATE POLICY "dispute_own"    ON disputes FOR SELECT USING (raised_by=auth.uid() OR get_my_role()='admin');
CREATE POLICY "dispute_insert" ON disputes FOR INSERT WITH CHECK (raised_by=auth.uid());
CREATE POLICY "dispute_admin"  ON disputes FOR ALL USING (get_my_role()='admin');

-- Notifications
CREATE POLICY "notif_own"    ON notifications FOR SELECT USING (user_id=auth.uid());
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (user_id=auth.uid());
CREATE POLICY "notif_admin"  ON notifications FOR ALL USING (get_my_role()='admin');

-- ── REALTIME ───────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE provider_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── DONE ───────────────────────────────────────────────────────
-- Next steps:
-- 1. Create admin user: Authentication → Users → Add User
--    Email: admin@powerstar.in  Password: Admin@2025!
-- 2. Run this in SQL Editor:
--    UPDATE profiles SET role='admin', full_name='POWERSTAR Admin'
--    WHERE id=(SELECT id FROM auth.users WHERE email='admin@powerstar.in');
-- 3. Create storage buckets: avatars (public), kyc-documents (private)
