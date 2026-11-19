# Supabase Storage — Private Bucket Setup

## Step 1: Create the `memories` bucket (if not already done)

In Supabase Dashboard → Storage → New bucket:
- Name: `memories`
- ❌ Public bucket: OFF (keep private)
- Click Create

## Step 2: Apply RLS Policies

In Supabase Dashboard → Storage → Policies → memories bucket,
OR go to SQL Editor and run the following:

```sql
-- ============================================================
-- PRIVATE STORAGE POLICIES FOR "memories" BUCKET
-- Only the service role (server-side) can read/write.
-- No anonymous or authenticated Supabase users need direct access
-- because all access goes through our signed URL API route.
-- ============================================================

-- Allow service role full access (this is automatic for service role,
-- but explicit policies help with clarity)

-- 1. DENY all public SELECT on the bucket (bucket is already private,
--    but this makes it explicit)
-- No public SELECT policy needed — just don't create one.

-- 2. Allow INSERT via service role (for uploads via sync scripts)
-- The UploadThing SDK uploads directly to UploadThing CDN, not Supabase.
-- If you use Supabase storage for uploads via server-side code, enable this:

-- CREATE POLICY "Service role can upload"
-- ON storage.objects FOR INSERT
-- TO service_role
-- WITH CHECK (bucket_id = 'memories');

-- 3. Allow SELECT via service role (for signed URL generation)
-- The service role bypasses RLS by default, so signed URL generation
-- via supabaseAdmin.storage.createSignedUrls() already works.

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check that the bucket exists and is NOT public:
SELECT id, name, public, created_at
FROM storage.buckets
WHERE name = 'memories';
-- Expected: public = false

-- Check how many objects are in the bucket:
SELECT COUNT(*) as file_count
FROM storage.objects
WHERE bucket_id = 'memories';

-- List first 10 files:
SELECT name, metadata->>'size' as size, created_at
FROM storage.objects
WHERE bucket_id = 'memories'
ORDER BY created_at DESC
LIMIT 10;
```

## Step 3: Verify signed URL generation works

After setting up the bucket, test via the app:
1. Log in to the website with password `220810`
2. Navigate to any room
3. Open browser DevTools → Network tab
4. Look for POST `/api/media/signed-urls` request
5. Response should contain `{ signed: { "original_url": "https://...supabase.co/storage/v1/object/sign/memories/..." } }`
6. Images should load in the gallery

## Step 4: Verify bucket is private

Try accessing an image URL directly in a browser (without being logged in):
- Take any URL from the database like:
  `https://yjwsrplqlkwoxywkgbxj.supabase.co/storage/v1/object/public/memories/...`
- It should return 400 "Bucket not found" or 403 "Unauthorized"
- This confirms the bucket is private ✅

Signed URLs look like:
`https://yjwsrplqlkwoxywkgbxj.supabase.co/storage/v1/object/sign/memories/path/file.jpg?token=...`
- These expire after 2 hours
- Only generated server-side after verifying `museum_auth` cookie
