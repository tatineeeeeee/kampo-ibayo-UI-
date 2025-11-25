-- Add 'completed' to the bookings status check constraint
-- This allows bookings to be marked as completed after checkout

-- First, drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Then, recreate it with 'completed' included
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'bookings'::regclass AND conname = 'bookings_status_check';
