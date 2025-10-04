-- ================================================================
-- COMPLETE REVIEW SYSTEM SETUP - RUN THIS SINGLE FILE
-- ================================================================
-- This file contains ALL the database changes needed for the review system
-- Safe to run multiple times - includes proper checks for existing objects

-- ================================================================
-- 1. FIX GUEST_REVIEWS TABLE (ensure approved column allows NULL)
-- ================================================================

-- First, ensure the approved column allows NULL values (for pending reviews)
DO $$ 
BEGIN 
    -- Check if approved column exists and fix its constraint
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_reviews' AND column_name = 'approved') THEN
        -- Drop the existing constraint if it exists
        ALTER TABLE guest_reviews ALTER COLUMN approved DROP NOT NULL;
        -- Make sure it can be NULL (pending), TRUE (approved), or FALSE (rejected)
        ALTER TABLE guest_reviews ALTER COLUMN approved SET DEFAULT NULL;
    END IF;
END $$;

-- ================================================================
-- 2. ADD CATEGORY RATINGS TO GUEST_REVIEWS
-- ================================================================

-- Add category rating columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_reviews' AND column_name = 'cleanliness_rating') THEN
        ALTER TABLE guest_reviews 
        ADD COLUMN cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
        ADD COLUMN service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
        ADD COLUMN location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
        ADD COLUMN value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
        ADD COLUMN amenities_rating INTEGER CHECK (amenities_rating >= 1 AND amenities_rating <= 5),
        ADD COLUMN stay_dates TEXT,
        ADD COLUMN anonymous BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ================================================================
-- 3. ADD REJECTION TRACKING COLUMNS
-- ================================================================

-- Add rejection tracking columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_reviews' AND column_name = 'rejection_reason') THEN
        ALTER TABLE guest_reviews 
        ADD COLUMN rejection_reason TEXT,
        ADD COLUMN resubmission_count INTEGER DEFAULT 0,
        ADD COLUMN original_submission_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- ================================================================
-- 4. CREATE REVIEW_PHOTOS TABLE
-- ================================================================

-- Create table for review photos with INTEGER IDs to match existing schema
CREATE TABLE IF NOT EXISTS review_photos (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES guest_reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 5. SETUP ROW LEVEL SECURITY FOR REVIEW_PHOTOS
-- ================================================================

-- Enable RLS for photos table
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert photos for their own reviews" ON review_photos;
DROP POLICY IF EXISTS "Everyone can view approved review photos" ON review_photos;

-- RLS policies for photos
CREATE POLICY "Users can insert photos for their own reviews" ON review_photos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM guest_reviews 
            WHERE guest_reviews.id = review_photos.review_id 
            AND guest_reviews.user_id = auth.uid()
        )
    );

CREATE POLICY "Everyone can view approved review photos" ON review_photos
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1 FROM guest_reviews 
            WHERE guest_reviews.id = review_photos.review_id 
            AND guest_reviews.approved = true
        )
    );

-- ================================================================
-- 6. CREATE PERFORMANCE INDEXES
-- ================================================================

-- Create indexes for better performance (skip if already exists)
CREATE INDEX IF NOT EXISTS idx_review_photos_review_id ON review_photos(review_id);
CREATE INDEX IF NOT EXISTS idx_guest_reviews_category_ratings ON guest_reviews(cleanliness_rating, service_rating, location_rating, value_rating, amenities_rating);
CREATE INDEX IF NOT EXISTS idx_guest_reviews_approved ON guest_reviews(approved);
CREATE INDEX IF NOT EXISTS idx_guest_reviews_user_id ON guest_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_reviews_created_at ON guest_reviews(created_at);

-- ================================================================
-- 7. VERIFICATION QUERIES
-- ================================================================

-- Verify the setup was successful
SELECT 
    'guest_reviews table columns:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'guest_reviews' 
ORDER BY ordinal_position;

SELECT 
    'review_photos table exists:' as info,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_name = 'review_photos';

SELECT 
    'RLS policies on review_photos:' as info,
    policyname
FROM pg_policies 
WHERE tablename = 'review_photos';

-- ================================================================
-- SETUP COMPLETE!
-- ================================================================
SELECT '✅ Review system database setup completed successfully!' as status;