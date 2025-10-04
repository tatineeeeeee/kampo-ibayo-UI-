-- Quick verification queries for review system debugging

-- 1. Check if review_photos table exists
SELECT 
    'review_photos table schema:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'review_photos' 
ORDER BY ordinal_position;

-- 2. Check if there are any approved reviews
SELECT 
    'approved reviews count:' as info,
    COUNT(*) as count,
    approved
FROM guest_reviews 
GROUP BY approved
ORDER BY approved;

-- 3. Check foreign key relationship (simplified)
SELECT 
    'foreign key constraints:' as info,
    constraint_name,
    table_name,
    column_name
FROM information_schema.key_column_usage 
WHERE table_name IN ('review_photos', 'guest_reviews')
  AND constraint_name LIKE '%fkey%';

-- 4. Test basic query
SELECT 
    'sample reviews:' as info,
    id, 
    guest_name, 
    rating, 
    approved,
    LEFT(review_text, 50) as preview
FROM guest_reviews 
WHERE approved = true 
LIMIT 3;

-- 5. Check if review_photos has any data
SELECT 
    'review_photos count:' as info,
    COUNT(*) as total_photos
FROM review_photos;

-- 6. Check recent reviews with details
SELECT 
    'recent reviews:' as info,
    id,
    guest_name,
    approved,
    created_at,
    rating
FROM guest_reviews 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Check storage bucket permissions (if accessible)
SELECT 
    'storage buckets:' as info,
    name,
    public
FROM storage.buckets 
WHERE name = 'review-photos';

-- 8. Test photo insertion manually (check if table structure is correct)
SELECT 
    'review_photos table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'review_photos' 
ORDER BY ordinal_position;