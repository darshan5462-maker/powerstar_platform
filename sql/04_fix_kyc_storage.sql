-- ============================================================
-- Fix KYC Documents Storage
-- ============================================================

-- 1. Create bucket as PUBLIC so document links work directly
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  true,  -- PUBLIC so URLs work without signed tokens
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','application/pdf'];

-- 2. Drop old storage policies
DROP POLICY IF EXISTS "kyc_provider_upload"   ON storage.objects;
DROP POLICY IF EXISTS "kyc_provider_read"     ON storage.objects;
DROP POLICY IF EXISTS "kyc_provider_update"   ON storage.objects;
DROP POLICY IF EXISTS "kyc_admin_read_all"    ON storage.objects;
DROP POLICY IF EXISTS "providers_upload_own_kyc" ON storage.objects;
DROP POLICY IF EXISTS "providers_view_own_kyc"   ON storage.objects;
DROP POLICY IF EXISTS "admins_view_all_kyc"      ON storage.objects;

-- 3. New clean policies
-- Anyone can READ public kyc docs (bucket is public anyway)
CREATE POLICY "kyc_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents');

-- Providers can upload to their own folder (folder name = their user id)
CREATE POLICY "kyc_provider_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Providers can update/delete their own files
CREATE POLICY "kyc_provider_manage"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "kyc_provider_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin can manage all
CREATE POLICY "kyc_admin_all"
ON storage.objects FOR ALL
USING (
  bucket_id = 'kyc-documents'
  AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Verify bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'kyc-documents';
