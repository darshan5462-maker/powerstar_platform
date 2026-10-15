-- ============================================================
-- 10. Phone OTP Authentication & Secure Profiles RLS
-- ============================================================

-- Enable RLS on profiles if not already enabled
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Drop old conflicting policies on profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_public_providers" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

-- 1. Users can view their own profile
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (id = auth.uid());

-- 2. Anyone authenticated can view provider profiles (for browsing and booking services)
CREATE POLICY "profiles_select_public_providers"
ON profiles FOR SELECT
USING (role = 'provider' AND is_active = true);

-- 3. Authenticated users can insert their own profile on registration
-- Strict Security: Role MUST be 'customer' or 'provider' (NEVER allow self-granting 'admin')
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (
  id = auth.uid()
  AND role IN ('customer', 'provider')
);

-- 4. Users can update their own non-admin profile details
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  -- Prevent privilege escalation: non-admins cannot change their role to 'admin'
  AND (
    role = (SELECT role FROM profiles WHERE id = auth.uid())
    OR role IN ('customer', 'provider')
  )
);

-- 5. Administrators have full access to all profiles
CREATE POLICY "profiles_admin_all"
ON profiles FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Ensure providers table RLS allows partner profile creation
ALTER TABLE IF EXISTS providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "providers_insert_own" ON providers;
DROP POLICY IF EXISTS "providers_update_own" ON providers;
DROP POLICY IF EXISTS "providers_select_all" ON providers;

CREATE POLICY "providers_select_all"
ON providers FOR SELECT
USING (true);

CREATE POLICY "providers_insert_own"
ON providers FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "providers_update_own"
ON providers FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
