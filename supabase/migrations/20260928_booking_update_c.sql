-- Enable customer to update their own bookings
-- This is necessary for customers to cancel bookings,
-- or to simulate payment success and confirm their own bookings from the frontend.

CREATE POLICY "booking_update_c" ON bookings
  FOR UPDATE USING (customer_id = auth.uid());
