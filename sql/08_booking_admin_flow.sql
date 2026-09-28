-- Add new statuses to booking_status enum
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'pending_admin' BEFORE 'pending';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'provider_assigned' AFTER 'pending_admin';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_pending' AFTER 'provider_assigned';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_success' AFTER 'payment_pending';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'confirmed' AFTER 'payment_success';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'confirmed';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rejected' AFTER 'cancelled';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_failed' AFTER 'rejected';

-- Add new statuses to payment_status enum
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'success' AFTER 'pending';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'cancelled' AFTER 'failed';

-- Update default status for bookings
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending_admin';
