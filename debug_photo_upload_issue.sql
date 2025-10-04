-- COMPLETE FIX FOR PHOTO UPLOAD ISSUE
-- Run this once to fix everything

-- 1. Drop and recreate review_photos table with correct INTEGER review_id
DROP TABLE IF EXISTS review_photos CASCADE;

CREATE TABLE review_photos (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES guest_reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS and create simple policies
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "authenticated_can_insert_photos" ON review_photos;
DROP POLICY IF EXISTS "public_can_read_approved_photos" ON review_photos;
DROP POLICY IF EXISTS "users_can_read_own_photos" ON review_photos;
DROP POLICY IF EXISTS "admins_full_access_photos" ON review_photos;

-- Create working policies
CREATE POLICY "authenticated_can_insert_photos" ON review_photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "public_can_read_approved_photos" ON review_photos FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM guest_reviews WHERE guest_reviews.id = review_photos.review_id AND guest_reviews.approved = true));
CREATE POLICY "users_can_read_own_photos" ON review_photos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM guest_reviews WHERE guest_reviews.id = review_photos.review_id AND guest_reviews.user_id::uuid = auth.uid()));
CREATE POLICY "admins_full_access_photos" ON review_photos FOR ALL TO authenticated USING ((auth.jwt() ->> 'email') IN ('admin@kampoibayo.com', 'manager@kampoibayo.com'));

-- 3. Grant permissions
GRANT SELECT, INSERT ON review_photos TO authenticated;
GRANT SELECT ON review_photos TO anon;
GRANT ALL ON review_photos TO service_role;

-- 4. Create indexes
CREATE INDEX idx_review_photos_review_id ON review_photos(review_id);
CREATE INDEX idx_review_photos_display_order ON review_photos(review_id, display_order);

-- 5. Test insert works now
BEGIN;
INSERT INTO review_photos (review_id, photo_url, display_order) VALUES (1, 'test_url', 1);
ROLLBACK;

SELECT 'Photo upload fix completed! Now photos should save properly.' as status;