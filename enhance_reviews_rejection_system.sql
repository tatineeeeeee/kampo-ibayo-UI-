-- Enhance review system with rejection reasons and resubmission tracking
-- This script adds fields to support better rejection handling

-- Add rejection reason and resubmission tracking
ALTER TABLE guest_reviews 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS resubmission_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_submission_date TIMESTAMP WITH TIME ZONE;

-- Update existing records to set original submission date
UPDATE guest_reviews 
SET original_submission_date = created_at 
WHERE original_submission_date IS NULL;

-- Add helpful comments
COMMENT ON COLUMN guest_reviews.rejection_reason IS 'Admin reason for rejecting the review - helps users understand what to fix';
COMMENT ON COLUMN guest_reviews.resubmission_count IS 'Number of times this review has been resubmitted after rejection';
COMMENT ON COLUMN guest_reviews.original_submission_date IS 'Date when the review was first submitted (before any resubmissions)';

-- Create function to check resubmission limits
CREATE OR REPLACE FUNCTION check_resubmission_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a resubmission for the same booking by the same user
    IF EXISTS (
        SELECT 1 FROM guest_reviews 
        WHERE user_id = NEW.user_id 
        AND booking_id = NEW.booking_id 
        AND approved = false 
        AND resubmission_count >= 2
    ) THEN
        RAISE EXCEPTION 'Maximum resubmission limit reached for this booking';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce resubmission limits (optional)
-- DROP TRIGGER IF EXISTS check_resubmission_limit_trigger ON guest_reviews;
-- CREATE TRIGGER check_resubmission_limit_trigger
--     BEFORE INSERT ON guest_reviews
--     FOR EACH ROW
--     EXECUTE FUNCTION check_resubmission_limit();

-- Create view for admin review management with rejection tracking
CREATE OR REPLACE VIEW admin_review_management AS
SELECT 
    gr.id,
    gr.guest_name,
    gr.guest_location,
    gr.rating,
    gr.review_text,
    gr.approved,
    gr.rejection_reason,
    gr.resubmission_count,
    gr.created_at,
    gr.original_submission_date,
    gr.stay_dates,
    gr.booking_id,
    gr.cleanliness_rating,
    gr.service_rating,
    gr.location_rating,
    gr.value_rating,
    gr.amenities_rating,
    CASE 
        WHEN gr.approved IS NULL THEN 'Pending Review'
        WHEN gr.approved = true THEN 'Approved'
        WHEN gr.approved = false AND gr.resubmission_count = 0 THEN 'Rejected (First Submission)'
        WHEN gr.approved = false AND gr.resubmission_count > 0 THEN 'Rejected (Resubmission #' || gr.resubmission_count || ')'
        ELSE 'Unknown Status'
    END as review_status,
    -- Calculate days since original submission
    EXTRACT(DAY FROM (NOW() - gr.original_submission_date))::INTEGER as days_since_original,
    -- Check if resubmission is still allowed (within 30 days, less than 2 resubmissions)
    CASE 
        WHEN gr.approved = false 
             AND gr.resubmission_count < 2 
             AND EXTRACT(DAY FROM (NOW() - gr.original_submission_date)) <= 30 
        THEN true 
        ELSE false 
    END as can_resubmit
FROM guest_reviews gr
ORDER BY gr.created_at DESC;

-- Grant appropriate permissions
-- GRANT SELECT ON admin_review_management TO authenticated;
-- GRANT ALL ON guest_reviews TO authenticated;

-- Example queries for admin use:

-- Get all pending reviews
-- SELECT * FROM admin_review_management WHERE approved IS NULL ORDER BY created_at ASC;

-- Get all rejected reviews that can still be resubmitted
-- SELECT * FROM admin_review_management WHERE approved = false AND can_resubmit = true;

-- Get reviews needing attention (old pending or multiple rejections)
-- SELECT * FROM admin_review_management 
-- WHERE (approved IS NULL AND days_since_original > 7) 
--    OR (approved = false AND resubmission_count >= 1);

PRINT 'Enhanced review rejection system with tracking and limits added successfully!';