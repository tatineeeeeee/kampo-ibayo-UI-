-- Enhanced review system with category ratings
-- This adds specific rating categories for better insights

-- Add category rating columns to guest_reviews table (skip if already exists)
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

-- Create table for review photos with INTEGER IDs to match existing schema
CREATE TABLE IF NOT EXISTS review_photos (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES guest_reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for photos table
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Create indexes for better performance (skip if already exists)
CREATE INDEX IF NOT EXISTS idx_review_photos_review_id ON review_photos(review_id);
CREATE INDEX IF NOT EXISTS idx_guest_reviews_category_ratings ON guest_reviews(cleanliness_rating, service_rating, location_rating, value_rating, amenities_rating);