-- Allow providers to update bookings they've accepted (start/complete)
DROP POLICY IF EXISTS "provider_update_booking" ON bookings;
DROP POLICY IF EXISTS "customer_update_own"      ON bookings;

CREATE POLICY "provider_update_booking"
ON bookings FOR UPDATE
USING (
  provider_id = auth.uid()
  OR (status = 'pending' AND provider_id IS NULL)
);

CREATE POLICY "customer_update_own"
ON bookings FOR UPDATE
USING (customer_id = auth.uid());

-- Verify
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'bookings' ORDER BY policyname;
