-- RLS Policy fix for guest_reviews table
-- Explicit type casting to avoid UUID = text operator issues

-- Enable RLS (if not already enabled)
ALTER TABLE guest_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own reviews" ON guest_reviews;
DROP POLICY IF EXISTS "Users can view approved reviews" ON guest_reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON guest_reviews;
DROP POLICY IF EXISTS "Admin can manage all reviews" ON guest_reviews;

-- Policy 1: Allow authenticated users to insert reviews with their auth ID
-- Use explicit casting and string comparison
CREATE POLICY "Users can insert their own reviews" ON guest_reviews
    FOR INSERT TO authenticated
    WITH CHECK (CAST(auth.uid() AS text) = user_id);

-- Policy 2: Allow everyone to view approved reviews
CREATE POLICY "Users can view approved reviews" ON guest_reviews
    FOR SELECT TO public
    USING (approved = true);

-- Policy 3: Allow users to view their own reviews (approved or not)
CREATE POLICY "Users can view their own reviews" ON guest_reviews
    FOR SELECT TO authenticated
    USING (CAST(auth.uid() AS text) = user_id);

-- Policy 4: Allow admins to manage all reviews (via users table role)
CREATE POLICY "Admin can manage all reviews" ON guest_reviews
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_id = CAST(auth.uid() AS text)
            AND users.role = 'admin'
        )
    );