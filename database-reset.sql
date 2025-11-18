-- Database Reset Script for Kampo Ibayo
-- WARNING: This will permanently delete ALL data from all tables
-- Use with extreme caution!

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Clear all data from tables (order matters due to foreign keys)
TRUNCATE TABLE review_photos CASCADE;
TRUNCATE TABLE guest_reviews CASCADE;
TRUNCATE TABLE admin_review_management CASCADE;
TRUNCATE TABLE booking_dates CASCADE;
TRUNCATE TABLE payment_proofs CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE gallery_images CASCADE;
TRUNCATE TABLE maintenance_settings CASCADE;
TRUNCATE TABLE users CASCADE;

-- Note: availability_calendar is a VIEW, so we don't truncate it

-- Reset auto-increment sequences to start from 1
ALTER SEQUENCE bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE booking_dates_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_proofs_id_seq RESTART WITH 1;
ALTER SEQUENCE gallery_images_id_seq RESTART WITH 1;
ALTER SEQUENCE maintenance_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE admin_review_management_id_seq RESTART WITH 1;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify reset (optional - run separately)
-- SELECT table_name, n_live_tup as row_count 
-- FROM pg_stat_user_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY table_name;