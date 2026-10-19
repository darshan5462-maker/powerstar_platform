-- ==============================================================================
-- 20261019000001_core_schema.sql
-- PowerStar Platform v2 — Extensions, Enums, Profiles & Provider Infrastructure
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
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

-- 3. PROFILES TABLE
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

-- Crucial: Drop legacy foreign key to auth.users so phone OTP accounts and seed providers can exist in profiles
DO $$ BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- Deduplicate profiles before creating unique index
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

-- 4. SERVICE CATEGORIES TABLE
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

-- Drop legacy unique constraint on name if it exists so slug is the authoritative unique identifier
DO $$ BEGIN
  ALTER TABLE public.service_categories DROP CONSTRAINT IF EXISTS service_categories_name_key;
  DROP INDEX IF EXISTS service_categories_name_key;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- 5. PROVIDERS TABLE
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

-- 6. PROVIDER SERVICES TABLE (MULTI-CATEGORY)
CREATE TABLE IF NOT EXISTS public.provider_services (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id      UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  category_id      UUID NOT NULL REFERENCES public.service_categories(id),
  hourly_rate      NUMERIC(10,2) DEFAULT 290,
  experience_years INTEGER DEFAULT 1,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, category_id)
);

-- 7. PROVIDER LOCATIONS TABLE (GPS)
CREATE TABLE IF NOT EXISTS public.provider_locations (
  provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  heading     DOUBLE PRECISION DEFAULT 0,
  speed       DOUBLE PRECISION DEFAULT 0,
  accuracy    DOUBLE PRECISION DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all GPS columns exist if provider_locations already existed previously
ALTER TABLE public.provider_locations ADD COLUMN IF NOT EXISTS heading DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.provider_locations ADD COLUMN IF NOT EXISTS speed DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.provider_locations ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.provider_locations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 8. CUSTOMER LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.customer_locations (
  booking_id   UUID PRIMARY KEY,
  customer_id  UUID NOT NULL REFERENCES public.profiles(id),
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  address      TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
