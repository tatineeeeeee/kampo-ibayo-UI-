-- =====================================================
-- ADD SUPER ADMIN COLUMN AND SET SUPER ADMIN
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add the is_super_admin column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Step 2: Make admin@kampoibayow.com a Super Admin
UPDATE users 
SET is_super_admin = true 
WHERE email = 'admin@kampoibayow.com';

-- Step 3: Verify the update
SELECT id, email, name, role, is_super_admin 
FROM users 
WHERE role = 'admin' OR is_super_admin = true;

-- =====================================================
-- PERMISSION HIERARCHY SUMMARY:
-- =====================================================
-- 
-- SUPER ADMIN (is_super_admin = true):
--   ✅ Can view/edit/delete ALL users including other admins
--   ✅ Cannot be deleted by anyone
--   ✅ Full access to all admin pages
--
-- ADMIN (role = 'admin', is_super_admin = false or null):
--   ✅ Can view/edit/delete regular users and staff
--   ❌ Cannot delete other admins
--   ❌ Cannot edit other admin roles
--   ✅ Full access to Users page and Settings page
--
-- STAFF (role = 'staff'):
--   ✅ Can approve/reject bookings and payments
--   ❌ Cannot access Users page
--   ❌ Cannot access Settings page
--
-- =====================================================
