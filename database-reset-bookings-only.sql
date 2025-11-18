-- Partial Database Reset - Bookings & Payments Only
-- This preserves users, gallery, and settings while clearing booking data

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Clear only booking-related data
TRUNCATE TABLE booking_dates CASCADE;
TRUNCATE TABLE payment_proofs CASCADE;
TRUNCATE TABLE bookings CASCADE;

-- Reset sequences for booking tables only
ALTER SEQUENCE bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE booking_dates_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_proofs_id_seq RESTART WITH 1;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify reset
SELECT table_name, n_live_tup as row_count 
FROM pg_stat_user_tables 
WHERE schemaname = 'public' AND table_name IN ('bookings', 'booking_dates', 'payment_proofs')
ORDER BY table_name;