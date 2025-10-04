-- DEBUG: Check review and photo display issues
-- Run this to see what's happening with your review and photos

-- 1. Check all reviews (approved and pending)
SELECT 
    id,
    guest_name,
    rating,
    review_text,
    approved,
    created_at,
    user_id
FROM guest_reviews 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check all review photos
SELECT 
    rp.id,
    rp.review_id,
    rp.photo_url,
    rp.caption,
    rp.display_order,
    rp.created_at,
    gr.guest_name,
    gr.approved as review_approved
FROM review_photos rp
JOIN guest_reviews gr ON gr.id = rp.review_id
ORDER BY rp.created_at DESC;

-- 3. Check approved reviews with photos (what should show on homepage)
SELECT 
    gr.id,
    gr.guest_name,
    gr.rating,
    gr.approved,
    COUNT(rp.id) as photo_count
FROM guest_reviews gr
LEFT JOIN review_photos rp ON rp.review_id = gr.id
WHERE gr.approved = true
GROUP BY gr.id, gr.guest_name, gr.rating, gr.approved
ORDER BY gr.created_at DESC;

-- 4. Test RLS policies - check if anonymous users can see approved reviews
-- This simulates what the homepage would see
SET ROLE anon; -- Switch to anonymous role
SELECT 
    gr.id,
    gr.guest_name,
    gr.rating,
    gr.review_text,
    gr.approved
FROM guest_reviews gr
WHERE gr.approved = true
ORDER BY gr.created_at DESC
LIMIT 3;

-- 5. Test RLS policies for photos - check if anonymous users can see photos of approved reviews
SELECT 
    rp.id,
    rp.review_id,
    rp.photo_url,
    rp.display_order
FROM review_photos rp
WHERE EXISTS (
    SELECT 1 FROM guest_reviews 
    WHERE guest_reviews.id = rp.review_id 
    AND guest_reviews.approved = true
)
ORDER BY rp.created_at DESC;

-- Reset role
RESET ROLE;

-- 6. Check storage bucket policies (if accessible)
-- Note: Storage policies need to be checked in Supabase dashboard
SELECT 'Check storage bucket policies in Supabase Dashboard > Storage > review-photos > Policies' as note;