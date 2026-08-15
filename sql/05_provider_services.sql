-- ============================================================
-- Run this in Supabase SQL Editor
-- Creates provider_services table for multiple services per provider
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_services (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id      UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  category_id      UUID NOT NULL REFERENCES service_categories(id),
  hourly_rate      NUMERIC(10,2) DEFAULT 290,
  experience_years INTEGER       DEFAULT 1,
  is_active        BOOLEAN       DEFAULT true,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(provider_id, category_id)
);

ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ps_read_all"   ON provider_services FOR SELECT USING (true);
CREATE POLICY "ps_own_insert" ON provider_services FOR INSERT WITH CHECK (provider_id = auth.uid());
CREATE POLICY "ps_own_update" ON provider_services FOR UPDATE USING (provider_id = auth.uid());
CREATE POLICY "ps_own_delete" ON provider_services FOR DELETE USING (provider_id = auth.uid());
CREATE POLICY "ps_admin_all"  ON provider_services FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Add existing provider services as first entries
INSERT INTO provider_services (provider_id, category_id, hourly_rate, experience_years)
SELECT id, category_id, COALESCE(hourly_rate, 290), COALESCE(experience_years, 1)
FROM providers
WHERE category_id IS NOT NULL
ON CONFLICT (provider_id, category_id) DO NOTHING;

SELECT 'provider_services created with ' || COUNT(*)::text || ' entries' as result
FROM provider_services;
