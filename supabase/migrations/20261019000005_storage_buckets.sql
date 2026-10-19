-- ==============================================================================
-- 20261019000005_storage_buckets.sql
-- PowerStar Platform v2 — Supabase Storage Buckets & Policies (KYC & Avatars)
-- ==============================================================================

-- 1. CREATE KYC-DOCUMENTS BUCKET (PUBLIC, 5MB LIMIT)
DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'kyc-documents',
    'kyc-documents',
    true,
    5242880,
    ARRAY['image/jpeg','image/jpg','image/png','image/webp','application/pdf']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','application/pdf'];
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- 2. CREATE AVATARS BUCKET (PUBLIC, 2MB LIMIT)
DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'avatars',
    'avatars',
    true,
    2097152,
    ARRAY['image/jpeg','image/jpg','image/png','image/webp']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp'];
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- 3. STORAGE OBJECTS POLICIES
DO $$ BEGIN
  DROP POLICY IF EXISTS "kyc_public_read"   ON storage.objects;
  DROP POLICY IF EXISTS "kyc_public_insert" ON storage.objects;
  DROP POLICY IF EXISTS "kyc_public_update" ON storage.objects;

  CREATE POLICY "kyc_public_read"   ON storage.objects FOR SELECT USING (bucket_id IN ('kyc-documents', 'avatars'));
  CREATE POLICY "kyc_public_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('kyc-documents', 'avatars'));
  CREATE POLICY "kyc_public_update" ON storage.objects FOR UPDATE USING (bucket_id IN ('kyc-documents', 'avatars'));
EXCEPTION WHEN OTHERS THEN null;
END $$;
