-- ================================================================
-- POWERSTAR v2 — COMPLETE FIX & MIGRATION SCRIPT
-- Run this script in:
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure Types & Enum Values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer','provider','admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
    CREATE TYPE kyc_status AS ENUM ('pending','submitted','verified','rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM (
      'pending_admin', 'provider_assigned', 'payment_pending', 'payment_success',
      'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected', 'payment_failed'
    );
  ELSE
    -- Add any missing enum values
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'pending_admin';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'provider_assigned';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_pending';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_success';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'confirmed';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'in_progress';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completed';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'cancelled';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rejected';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_failed';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending','success','failed','cancelled','held','released','refunded');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
    CREATE TYPE service_type AS ENUM ('manpower','vehicle','rto','financial');
  END IF;
END $$;

-- 3. Profiles Table Structure & Fallback User
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY,
  role        user_role NOT NULL DEFAULT 'customer',
  full_name   TEXT NOT NULL DEFAULT 'User',
  phone       TEXT,
  avatar_url  TEXT,
  district    TEXT,
  city        TEXT,
  address     TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Guest / Demo Customer Profile (to avoid foreign key failures)
INSERT INTO profiles (id, full_name, role, phone, district, city, is_active)
VALUES 
  ('c0000000-0000-4000-8000-000000000001', 'Demo Customer', 'customer', '+91 98450 11111', 'Bengaluru Urban', 'Koramangala', true)
ON CONFLICT (id) DO UPDATE SET is_active = true;

-- 4. Service Categories
CREATE TABLE IF NOT EXISTS service_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  name_kn     TEXT,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  type        service_type NOT NULL DEFAULT 'manpower',
  base_price  NUMERIC(10,2),
  price_unit  TEXT,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Essential Service Categories
INSERT INTO service_categories (name, name_kn, slug, icon, type, base_price, price_unit, description, sort_order)
VALUES
  ('Electrician', 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್', 'electrician', '⚡', 'manpower', 299, 'per visit', 'Wiring, repair, switches, appliance installation', 1),
  ('Plumber', 'ಪ್ಲಂಬರ್', 'plumber', '🔧', 'manpower', 249, 'per visit', 'Pipe repair, taps, leaks, bathroom fittings', 2),
  ('Carpenter', 'ಬಡಗಿ', 'carpenter', '🪚', 'manpower', 299, 'per visit', 'Furniture repair, doors, windows, woodwork', 3),
  ('House Cleaning', 'ಮನೆ ಶುಚಿಗೊಳಿಸುವಿಕೆ', 'cleaning', '🧹', 'manpower', 499, 'per service', 'Deep home, kitchen & bathroom cleaning', 4),
  ('Mason & Tile Work', 'ಮೇಸ್ತ್ರಿ', 'mason', '🧱', 'manpower', 499, 'per day', 'Tile fixing, plastering, cement brickwork', 5),
  ('Painter', 'ಪೇಂಟರ್', 'painter', '🎨', 'manpower', 399, 'per day', 'Wall painting, waterproofing, touch-up', 6),
  ('Tata Ace (750kg)', 'ಟಾಟಾ ಏಸ್', 'tata-ace', '🚐', 'vehicle', 799, 'per trip', 'Intra-city goods transport up to 750kg', 7),
  ('Driver on Demand', 'ಡ್ರೈವರ್', 'driver', '🚗', 'vehicle', 399, 'per 4 hrs', 'Professional personal & commercial drivers', 8),
  ('Driving Licence (DL)', 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್', 'rto-dl', '🪪', 'rto', 1499, 'per service', 'New DL, renewal, LL and international permit', 9),
  ('Personal Loan Assistance', 'ವೈಯಕ್ತಿಕ ಸಾಲ', 'fin-personal-loan', '💳', 'financial', 499, 'per application', 'Fast documentation with leading national banks', 10)
ON CONFLICT (slug) DO UPDATE SET is_active = true;

-- 5. Bookings Table Structure
CREATE TABLE IF NOT EXISTS bookings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref         TEXT UNIQUE NOT NULL,
  customer_id         UUID NOT NULL,
  provider_id         UUID,
  category_id         UUID REFERENCES service_categories(id),
  category_slug       TEXT,
  status              booking_status NOT NULL DEFAULT 'pending_admin',
  address             TEXT NOT NULL,
  city                TEXT NOT NULL,
  district            TEXT NOT NULL,
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  scheduled_at        TIMESTAMPTZ,
  accepted_at         TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  base_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  start_otp           TEXT,
  end_otp             TEXT,
  customer_notes      TEXT,
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Row Level Security Policies (Ensuring admin & customer full visibility)
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies to prevent conflicts
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_all_categories" ON service_categories;
DROP POLICY IF EXISTS "allow_all_bookings" ON bookings;
DROP POLICY IF EXISTS "booking_customer" ON bookings;
DROP POLICY IF EXISTS "booking_provider" ON bookings;
DROP POLICY IF EXISTS "booking_insert" ON bookings;
DROP POLICY IF EXISTS "booking_admin" ON bookings;

-- Create Open & Resilient Policies
CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categories" ON service_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);

-- 7. Realtime Synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- 8. Promote admin@powerstar.in to Admin Role if user exists
DO $$
BEGIN
  UPDATE profiles 
  SET role = 'admin', full_name = 'POWERSTAR Master Admin'
  WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@powerstar.in');
END $$;
