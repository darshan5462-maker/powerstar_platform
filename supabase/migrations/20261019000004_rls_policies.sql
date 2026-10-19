-- ==============================================================================
-- 20261019000004_rls_policies.sql
-- PowerStar Platform v2 — Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings  ENABLE ROW LEVEL SECURITY;

-- 2. PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_read_all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;

CREATE POLICY "profiles_read_all"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_all" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_all" ON public.profiles FOR UPDATE USING (true);

-- 3. SERVICE CATEGORIES POLICIES
DROP POLICY IF EXISTS "categories_read_all"  ON public.service_categories;
DROP POLICY IF EXISTS "categories_admin_all" ON public.service_categories;

CREATE POLICY "categories_read_all"  ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON public.service_categories FOR ALL USING (true);

-- 4. PROVIDERS & PROVIDER SERVICES POLICIES
DROP POLICY IF EXISTS "providers_read_all"  ON public.providers;
DROP POLICY IF EXISTS "providers_write_all" ON public.providers;
DROP POLICY IF EXISTS "ps_read_all"         ON public.provider_services;
DROP POLICY IF EXISTS "ps_write_all"        ON public.provider_services;

CREATE POLICY "providers_read_all"  ON public.providers FOR SELECT USING (true);
CREATE POLICY "providers_write_all" ON public.providers FOR ALL USING (true);
CREATE POLICY "ps_read_all"         ON public.provider_services FOR SELECT USING (true);
CREATE POLICY "ps_write_all"        ON public.provider_services FOR ALL USING (true);

-- 5. LOCATIONS POLICIES (LIVE TRACKING)
DROP POLICY IF EXISTS "loc_read_all"  ON public.provider_locations;
DROP POLICY IF EXISTS "loc_write_all" ON public.provider_locations;
DROP POLICY IF EXISTS "cusloc_all"    ON public.customer_locations;

CREATE POLICY "loc_read_all"  ON public.provider_locations FOR SELECT USING (true);
CREATE POLICY "loc_write_all" ON public.provider_locations FOR ALL USING (true);
CREATE POLICY "cusloc_all"    ON public.customer_locations FOR ALL USING (true);

-- 6. BOOKINGS, PAYMENTS, REVIEWS, DISPUTES & NOTIFICATIONS
DROP POLICY IF EXISTS "bookings_read_all"   ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_all" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_all" ON public.bookings;

CREATE POLICY "bookings_read_all"   ON public.bookings FOR SELECT USING (true);
CREATE POLICY "bookings_insert_all" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_update_all" ON public.bookings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "payments_all" ON public.payments;
CREATE POLICY "payments_all" ON public.payments FOR ALL USING (true);

DROP POLICY IF EXISTS "reviews_all" ON public.reviews;
CREATE POLICY "reviews_all" ON public.reviews FOR ALL USING (true);

DROP POLICY IF EXISTS "disputes_all" ON public.disputes;
CREATE POLICY "disputes_all" ON public.disputes FOR ALL USING (true);

DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "settings_read"  ON public.platform_settings;
DROP POLICY IF EXISTS "settings_admin" ON public.platform_settings;

CREATE POLICY "settings_read"  ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin" ON public.platform_settings FOR ALL USING (true);
