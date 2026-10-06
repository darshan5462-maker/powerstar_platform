-- ====================================================================
-- POWERSTAR — 1-CLICK FIX FOR ALL BOOKINGS, PERMISSIONS & RLS
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Paste -> Run
-- ====================================================================

-- 1. Ensure Enum types have all required status values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM (
      'pending_admin', 'provider_assigned', 'payment_pending', 'payment_success',
      'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected', 'payment_failed'
    );
  ELSE
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
  ELSE
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'success';
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'cancelled';
  END IF;
END $$;

-- 2. Ensure columns exist on bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_ref TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_otp TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_otp TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS category_slug TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS base_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10,2) DEFAULT 0;

-- 3. REMOVE RESTRICTIVE RLS POLICIES & GRANT OPEN PERMISSION
-- This ensures mobile clients, desktop admin, and customer apps can read/write without 403 / empty returns
DROP POLICY IF EXISTS "allow_all_bookings" ON bookings;
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_all_categories" ON service_categories;
DROP POLICY IF EXISTS "allow_all_providers" ON providers;
DROP POLICY IF EXISTS "customer_own_bookings" ON bookings;
DROP POLICY IF EXISTS "admin_all_bookings" ON bookings;
DROP POLICY IF EXISTS "provider_see_pending" ON bookings;
DROP POLICY IF EXISTS "customer_insert_booking" ON bookings;
DROP POLICY IF EXISTS "provider_update_booking" ON bookings;
DROP POLICY IF EXISTS "customer_update_own" ON bookings;
DROP POLICY IF EXISTS "booking_customer" ON bookings;
DROP POLICY IF EXISTS "booking_provider" ON bookings;
DROP POLICY IF EXISTS "booking_insert" ON bookings;
DROP POLICY IF EXISTS "booking_update_p" ON bookings;
DROP POLICY IF EXISTS "booking_admin" ON bookings;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categories" ON service_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_providers" ON providers FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Supabase Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
