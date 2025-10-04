-- Setup review photos storage bucket and fix schema
-- This sets up the Supabase storage bucket for review photos and corrects the schema

-- First, let's check if review_photos table needs to be recreated with correct schema
DROP TABLE IF EXISTS review_photos;

-- Create review_photos table with correct schema to match TypeScript types
CREATE TABLE review_photos (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES guest_reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for photos table
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

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

-- Admin can manage all review photos
CREATE POLICY "Admins can manage all review photos" ON review_photos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_review_photos_review_id ON review_photos(review_id);
CREATE INDEX idx_review_photos_display_order ON review_photos(review_id, display_order);

-- Insert storage bucket for review photos (this needs to be run in the Supabase dashboard)
-- Storage bucket setup (manual step):
-- 1. Go to Supabase Dashboard -> Storage
-- 2. Create a new bucket called "review-photos"
-- 3. Set it to public: true
-- 4. Set file size limit to 5MB
-- 5. Allowed file types: image/jpeg, image/png, image/webp

-- Storage policies will be automatically created when the bucket is created