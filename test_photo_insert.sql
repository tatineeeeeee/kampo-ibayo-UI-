-- Test photo insertion to debug the issue
-- Run this AFTER running debug_reviews.sql to get a review ID

-- First, get a review ID that exists
SELECT 
    'Available review IDs:' as info,
    id,
    guest_name,
    approved
FROM guest_reviews 
WHERE approved = true
LIMIT 3;

-- Try to manually insert a test photo record (replace 1 with actual review ID from above)
-- Uncomment and run this after getting a real review ID:

/*
INSERT INTO review_photos (
    review_id,
    photo_url,
    display_order
) VALUES (
    1, -- Replace with actual review ID
    'https://example.com/test-photo.jpg',
    1
);
*/

-- Check if the insert worked
SELECT 
    'Photo records after test:' as info,
    COUNT(*) as count
FROM review_photos;