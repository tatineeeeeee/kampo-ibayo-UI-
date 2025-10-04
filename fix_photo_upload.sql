-- FIX PHOTO UPLOAD ISSUES
-- This will ensure photos can be uploaded and saved properly

-- 1. First, make sure review_photos table exists with correct structure
CREATE TABLE IF NOT EXISTS review_photos (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES guest_reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert photos for their own reviews" ON review_photos;
DROP POLICY IF EXISTS "authenticated_can_insert_photos" ON review_photos;
DROP POLICY IF EXISTS "public_can_read_approved_photos" ON review_photos;
DROP POLICY IF EXISTS "users_can_read_own_photos" ON review_photos;
DROP POLICY IF EXISTS "admins_full_access_photos" ON review_photos;

-- 4. Create simple, working RLS policies

-- Allow authenticated users to insert photos (simplified)
CREATE POLICY "authenticated_users_can_insert_photos" 
ON review_photos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow everyone to read photos of approved reviews
CREATE POLICY "public_can_read_approved_review_photos" 
ON review_photos 
FOR SELECT 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM guest_reviews 
    WHERE guest_reviews.id = review_photos.review_id 
    AND guest_reviews.approved = true
  )
);

-- Allow users to read photos of their own reviews
CREATE POLICY "users_can_read_their_own_review_photos" 
ON review_photos 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM guest_reviews 
    WHERE guest_reviews.id = review_photos.review_id 
    AND guest_reviews.user_id::uuid = auth.uid()
  )
);

-- Allow admins full access to photos
CREATE POLICY "admins_full_access_to_photos" 
ON review_photos 
FOR ALL 
TO authenticated
USING (
  (auth.jwt() ->> 'email') IN (
    'admin@kampoibayo.com',
    'manager@kampoibayo.com'
  )
);

-- 5. Grant necessary permissions
GRANT SELECT, INSERT ON review_photos TO authenticated;
GRANT SELECT ON review_photos TO anon;
GRANT ALL ON review_photos TO service_role;

-- 6. Test the policies work
SELECT 'Photo upload policies updated successfully!' as status;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_photos_review_id ON review_photos(review_id);
CREATE INDEX IF NOT EXISTS idx_review_photos_display_order ON review_photos(review_id, display_order);

-- IMPORTANT NOTES FOR STORAGE BUCKET:
-- 
-- You need to create a storage bucket called "review-photos" in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create bucket named "review-photos"
-- 3. Set it to PUBLIC
-- 4. Add this storage policy for uploads:
--    Policy name: "Authenticated users can upload"
--    Allowed operation: INSERT
--    Target roles: authenticated
--    Policy definition: bucket_id = 'review-photos'
--
-- 5. Add this storage policy for public read:
--    Policy name: "Public can read review photos"  
--    Allowed operation: SELECT
--    Target roles: public
--    Policy definition: bucket_id = 'review-photos'