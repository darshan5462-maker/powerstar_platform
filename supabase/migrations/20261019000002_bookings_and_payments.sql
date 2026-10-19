-- ==============================================================================
-- 20261019000002_bookings_and_payments.sql
-- PowerStar Platform v2 — Bookings, Payments, Reviews, Disputes & Settings
-- ==============================================================================

-- 1. BOOKINGS TABLE
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

-- Foreign key for customer_locations
DO $$ BEGIN
  ALTER TABLE public.customer_locations
    DROP CONSTRAINT IF EXISTS customer_locations_booking_id_fkey;
  ALTER TABLE public.customer_locations
    ADD CONSTRAINT customer_locations_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- 2. PAYMENTS TABLE
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

-- 3. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DISPUTES TABLE
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

-- 5. NOTIFICATIONS TABLE
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

-- 6. PLATFORM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at  ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_providers_category   ON public.providers(category_id);
CREATE INDEX IF NOT EXISTS idx_providers_kyc        ON public.providers(kyc_status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id  ON public.payments(booking_id);
