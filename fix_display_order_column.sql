-- Fix missing display_order column in review_photos table

-- Check if display_order column exists, if not add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_photos' AND column_name = 'display_order') THEN
        ALTER TABLE review_photos ADD COLUMN display_order INTEGER DEFAULT 1;
        UPDATE review_photos SET display_order = 1 WHERE display_order IS NULL;
        RAISE NOTICE 'Added display_order column to review_photos table';
    ELSE
        RAISE NOTICE 'display_order column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    'review_photos columns after fix:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'review_photos' 
ORDER BY ordinal_position;