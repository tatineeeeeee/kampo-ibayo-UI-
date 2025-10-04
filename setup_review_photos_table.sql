-- Create review_photos table for photo uploads
-- This script is safe to run multiple times

-- Create the review_photos table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_photos_review_id ON review_photos(review_id);

-- Verify the table was created
SELECT 'review_photos table created successfully' as status;