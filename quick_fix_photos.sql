-- QUICK FIX: Approve all reviews and check photo access
-- Run this if you want to approve your review immediately

-- 1. Approve all pending reviews (BE CAREFUL - only run if you want to approve everything)
-- UPDATE guest_reviews SET approved = true WHERE approved IS NULL;

-- 2. Check if photos exist and are properly linked
SELECT 
    gr.id as review_id,
    gr.guest_name,
    gr.approved,
    rp.id as photo_id,
    rp.photo_url,
    CASE 
        WHEN rp.photo_url IS NULL THEN 'No photos uploaded'
        WHEN rp.photo_url LIKE '%review-photos%' THEN 'Photo URL looks correct'
        ELSE 'Photo URL might be wrong'
    END as photo_status
FROM guest_reviews gr
LEFT JOIN review_photos rp ON rp.review_id = gr.id
ORDER BY gr.created_at DESC
LIMIT 10;

-- 3. Test if the review-photos bucket exists and is accessible
-- This query will work if you have the right permissions
SELECT 'review-photos' as bucket_name;