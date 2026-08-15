-- ============================================================
-- Fix bookings RLS so providers can see pending bookings
-- ============================================================

-- Drop old conflicting booking policies
DROP POLICY IF EXISTS "booking_customer"   ON bookings;
DROP POLICY IF EXISTS "booking_provider"   ON bookings;
DROP POLICY IF EXISTS "booking_insert"     ON bookings;
DROP POLICY IF EXISTS "booking_update_p"   ON bookings;
DROP POLICY IF EXISTS "booking_admin"      ON bookings;
DROP POLICY IF EXISTS "booking_customer_read" ON bookings;
DROP POLICY IF EXISTS "booking_provider_read" ON bookings;

-- Customer can see their own bookings
CREATE POLICY "customer_own_bookings"
ON bookings FOR SELECT
USING (customer_id = auth.uid());

-- Provider can see ALL pending bookings (to find work)
-- AND their accepted/active/completed bookings
CREATE POLICY "provider_see_pending"
ON bookings FOR SELECT
USING (
  status = 'pending'
  OR provider_id = auth.uid()
);

-- Customer can create bookings
CREATE POLICY "customer_insert_booking"
ON bookings FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- Provider can update bookings (accept, complete)
CREATE POLICY "provider_update_booking"
ON bookings FOR UPDATE
USING (
  provider_id = auth.uid()
  OR (status = 'pending' AND provider_id IS NULL)
);

-- Customer can cancel their own bookings
CREATE POLICY "customer_update_own"
ON bookings FOR UPDATE
USING (customer_id = auth.uid());

-- Admin sees everything
CREATE POLICY "admin_all_bookings"
ON bookings FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'bookings' ORDER BY policyname;
