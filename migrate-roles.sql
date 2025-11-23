-- Migration script to update role system from guest/moderator to user/staff
-- Run this in your Supabase SQL editor if you have existing data

-- Update 'guest' role to 'user'
UPDATE users 
SET role = 'user' 
WHERE role = 'guest';

-- Update 'moderator' role to 'staff' 
UPDATE users 
SET role = 'staff' 
WHERE role = 'moderator';

-- Verify the changes
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;

-- Expected results should show: admin, staff, user (no guest or moderator)