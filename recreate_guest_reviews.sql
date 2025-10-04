-- Drop and recreate guest_reviews table with proper types
-- This fixes all the UUID vs text type casting issues

-- Drop the existing table and its policies
DROP TABLE IF EXISTS guest_reviews CASCADE;

-- Create the new guest_reviews table with proper types
CREATE TABLE guest_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id BIGINT REFERENCES bookings(id) ON DELETE SET NULL,
    guest_name TEXT NOT NULL,
    guest_location TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE guest_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with proper UUID types (no casting needed)
CREATE POLICY "Users can insert their own reviews" ON guest_reviews
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view approved reviews" ON guest_reviews
    FOR SELECT TO public
    USING (approved = true);

CREATE POLICY "Users can view their own reviews" ON guest_reviews
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all reviews" ON guest_reviews
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_guest_reviews_user_id ON guest_reviews(user_id);
CREATE INDEX idx_guest_reviews_booking_id ON guest_reviews(booking_id);
CREATE INDEX idx_guest_reviews_approved ON guest_reviews(approved);
CREATE INDEX idx_guest_reviews_created_at ON guest_reviews(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_guest_reviews_updated_at
    BEFORE UPDATE ON guest_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();