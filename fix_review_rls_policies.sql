-- SIMPLE & SECURE RLS POLICIES FOR SMALL BOOKING SYSTEM
-- Best practices: Only authenticated users can submit, everyone can read approved reviews

-- Enable RLS on both tables
ALTER TABLE guest_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

-- Clean slate: Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated insert review photos" ON review_photos;
DROP POLICY IF EXISTS "Allow anonymous read review photos" ON review_photos;
DROP POLICY IF EXISTS "Allow admin manage review photos" ON review_photos;
DROP POLICY IF EXISTS "Allow read approved review photos" ON review_photos;
DROP POLICY IF EXISTS "Allow read own review photos" ON review_photos;

DROP POLICY IF EXISTS "Allow authenticated insert reviews" ON guest_reviews;
DROP POLICY IF EXISTS "Allow read approved reviews" ON guest_reviews;
DROP POLICY IF EXISTS "Allow admin manage reviews" ON guest_reviews;

-- === GUEST_REVIEWS POLICIES ===

-- 1. Only authenticated users can submit reviews
CREATE POLICY "authenticated_can_insert_reviews" 
ON guest_reviews 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 2. Everyone can read approved reviews (for homepage display)
CREATE POLICY "public_can_read_approved_reviews" 
ON guest_reviews 
FOR SELECT 
TO anon, authenticated
USING (approved = true);

-- 3. Users can read their own reviews (any status)
CREATE POLICY "users_can_read_own_reviews" 
ON guest_reviews 
FOR SELECT 
TO authenticated
USING (user_id::uuid = auth.uid());

-- 4. Admins have full access
CREATE POLICY "admins_full_access_reviews" 
ON guest_reviews 
FOR ALL 
TO authenticated
USING (
  (auth.jwt() ->> 'email') IN (
    'admin@kampoibayo.com',
    'manager@kampoibayo.com'
  )
);

-- === REVIEW_PHOTOS POLICIES ===

-- 1. Only authenticated users can upload photos
CREATE POLICY "authenticated_can_insert_photos" 
ON review_photos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 2. Everyone can view photos of approved reviews
CREATE POLICY "public_can_read_approved_photos" 
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

-- 3. Users can view photos of their own reviews
CREATE POLICY "users_can_read_own_photos" 
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

-- 4. Admins have full access to photos
CREATE POLICY "admins_full_access_photos" 
ON review_photos 
FOR ALL 
TO authenticated
USING (
  (auth.jwt() ->> 'email') IN (
    'admin@kampoibayo.com',
    'manager@kampoibayo.com'
  )
);

-- === GRANTS (Essential for proper access) ===
GRANT SELECT ON guest_reviews TO anon, authenticated;
GRANT INSERT ON guest_reviews TO authenticated;
GRANT SELECT ON review_photos TO anon, authenticated;
GRANT INSERT ON review_photos TO authenticated;

-- Service role needs full access for admin operations
GRANT ALL ON guest_reviews TO service_role;
GRANT ALL ON review_photos TO service_role;