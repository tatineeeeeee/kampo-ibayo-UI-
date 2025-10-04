-- Check current RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename IN ('guest_reviews', 'review_photos') 
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('guest_reviews', 'review_photos');