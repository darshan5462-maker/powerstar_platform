-- ============================================================
-- ABSOLUTE FINAL FIX
-- Add anon role explicitly so even unauthenticated reads work
-- The Supabase JS client uses anon key for all queries
-- ============================================================

-- Drop everything first
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'providers' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON providers';
  END LOOP;
END $$;

-- Allow BOTH anon AND authenticated to read verified+online providers
CREATE POLICY "anyone_read_verified_online"
ON providers FOR SELECT
USING (kyc_status = 'verified' AND is_online = true);

-- Provider reads their own row
CREATE POLICY "provider_read_own"
ON providers FOR SELECT
USING (id = auth.uid());

-- Provider writes their own row
CREATE POLICY "provider_insert_own"
ON providers FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "provider_update_own"
ON providers FOR UPDATE
USING (id = auth.uid());

-- Admin everything
CREATE POLICY "admin_all"
ON providers FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- NOW TEST with anon role — change dropdown to "anon" and run:
-- SELECT id, kyc_status, is_online FROM providers 
-- WHERE kyc_status = 'verified' AND is_online = true;
-- Should return Darshan's row

SELECT policyname, cmd FROM pg_policies WHERE tablename = 'providers';
