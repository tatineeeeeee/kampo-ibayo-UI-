-- =====================================================
-- SET SUPER ADMIN
-- Run this in Supabase SQL Editor to make an account Super Admin
-- =====================================================

-- Make admin@kampoibayow.com a Super Admin
UPDATE users 
SET is_super_admin = true 
WHERE email = 'admin@kampoibayow.com';

-- Verify the update
SELECT id, email, name, role, is_super_admin 
FROM users 
WHERE email = 'admin@kampoibayow.com';

-- =====================================================
-- PERMISSION HIERARCHY SUMMARY:
-- =====================================================
-- 
-- SUPER ADMIN (is_super_admin = true):
--   ✅ Can view/edit/delete ALL users including other admins
--   ✅ Cannot be deleted by anyone
--   ✅ Full access to Users page and Settings page
--
-- ADMIN (role = 'admin', is_super_admin = false):
--   ✅ Can view/edit/delete regular users and staff
--   ❌ Cannot delete other admins
--   ❌ Cannot edit other admin roles
--   ✅ Full access to Users page and Settings page
--
-- STAFF (role = 'staff'):
--   ✅ Can approve/reject bookings and payments
--   ❌ Cannot access Users page
--   ❌ Cannot access Settings page
--   ❌ Cannot delete or edit any users
--
-- USER (role = 'user'):
--   Regular user - no admin panel access
-- =====================================================
