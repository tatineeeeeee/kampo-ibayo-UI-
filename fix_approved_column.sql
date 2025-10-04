-- Fix the approved column to allow NULL values for pending reviews
-- This fixes the issue where new reviews are marked as false (rejected) instead of null (pending)

-- First, update any existing false values to null if they should be pending
UPDATE guest_reviews 
SET approved = NULL 
WHERE approved = false 
  AND created_at > NOW() - INTERVAL '24 hours'  -- Only recent submissions
  AND rejection_reason IS NULL;  -- Only if no rejection reason was set

-- Alter the column to allow NULL and set default to NULL
ALTER TABLE guest_reviews 
ALTER COLUMN approved DROP NOT NULL,
ALTER COLUMN approved SET DEFAULT NULL;

-- Add a helpful comment
COMMENT ON COLUMN guest_reviews.approved IS 'NULL = pending review, true = approved, false = rejected';

-- Show current review statuses for verification
SELECT 
  id,
  guest_name,
  approved,
  created_at,
  CASE 
    WHEN approved IS NULL THEN 'Pending'
    WHEN approved = true THEN 'Approved' 
    WHEN approved = false THEN 'Rejected'
  END as status
FROM guest_reviews 
ORDER BY created_at DESC 
LIMIT 10;