-- ============================================================
-- Live Location Tracking System
-- ============================================================

-- 1. Provider locations table (upsert on every GPS update)
CREATE TABLE IF NOT EXISTS provider_locations (
  provider_id  UUID PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
  latitude     DECIMAL(10, 8) NOT NULL,
  longitude    DECIMAL(11, 8) NOT NULL,
  heading      DECIMAL(5, 2)  DEFAULT 0,   -- direction in degrees
  speed        DECIMAL(6, 2)  DEFAULT 0,   -- km/h
  accuracy     DECIMAL(8, 2)  DEFAULT 0,   -- meters
  updated_at   TIMESTAMPTZ    DEFAULT NOW()
);

ALTER TABLE provider_locations ENABLE ROW LEVEL SECURITY;

-- Provider updates own location
CREATE POLICY "loc_provider_write" ON provider_locations FOR ALL
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

-- Anyone can read locations (needed for customer tracking)
CREATE POLICY "loc_public_read" ON provider_locations FOR SELECT
USING (true);

-- Admin full access
CREATE POLICY "loc_admin_all" ON provider_locations FOR ALL
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 2. Customer locations table (for provider to navigate to customer)
CREATE TABLE IF NOT EXISTS customer_locations (
  booking_id   UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES profiles(id),
  latitude     DECIMAL(10, 8) NOT NULL,
  longitude    DECIMAL(11, 8) NOT NULL,
  address      TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cusloc_own" ON customer_locations FOR ALL
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "cusloc_provider_read" ON customer_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id
    AND bookings.provider_id = auth.uid()
  )
);

CREATE POLICY "cusloc_admin" ON customer_locations FOR ALL
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 3. Enable realtime on both tables
ALTER PUBLICATION supabase_realtime ADD TABLE provider_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE customer_locations;

-- Verify
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename;
