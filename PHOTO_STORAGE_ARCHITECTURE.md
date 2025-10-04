# Photo Storage Architecture in Supabase

## Database Tables

### 1. guest_reviews table
- **Primary Key**: `id` (UUID) - e.g., '127de46c-045d-4579-8961-4efa7e639476'
- Contains review text, ratings, guest info
- Photos are linked via foreign key relationship

### 2. review_photos table
- **Primary Key**: `id` (integer, auto-increment)
- **Foreign Key**: `review_id` (UUID) - references guest_reviews.id
- **photo_url**: Full URL to the image in Supabase Storage
- **caption**: Optional description
- **display_order**: Order for displaying multiple photos
- **created_at**: Timestamp

## Storage Bucket

### Bucket Name: `review-photos`
### File Path Structure: 
```
review-photos/
├── review_127de46c-045d-4579-8961-4efa7e639476_photo_1.jpg
├── review_127de46c-045d-4579-8961-4efa7e639476_photo_2.jpg
└── review_127de46c-045d-4579-8961-4efa7e639476_photo_3.png
```

### Full URL Pattern:
```
https://pwgunyrvtpntsypqcwiq.supabase.co/storage/v1/object/public/review-photos/review_[REVIEW_ID]_photo_[NUMBER].[EXTENSION]
```

## How Photos are Connected

1. **Review Created** → Gets UUID (e.g., '127de46c-045d-4579-8961-4efa7e639476')
2. **Photos Uploaded** → Stored in bucket with filenames containing the review UUID
3. **Database Records** → review_photos table stores the connection:
   - review_id: '127de46c-045d-4579-8961-4efa7e639476'
   - photo_url: 'https://pwgunyrvtpntsypqcwiq.supabase.co/storage/v1/object/public/review-photos/review_127de46c-045d-4579-8961-4efa7e639476_photo_1.jpg'

## Example Data Flow

```sql
-- 1. Review in guest_reviews table
INSERT INTO guest_reviews (id, guest_name, rating, review_text, ...)
VALUES ('127de46c-045d-4579-8961-4efa7e639476', 'John Doe', 5, 'Great stay!', ...);

-- 2. Photos in review_photos table
INSERT INTO review_photos (review_id, photo_url, display_order)
VALUES 
  ('127de46c-045d-4579-8961-4efa7e639476', 'https://pwgunyrvtpntsypqcwiq.supabase.co/storage/v1/object/public/review-photos/review_127de46c-045d-4579-8961-4efa7e639476_photo_1.jpg', 1),
  ('127de46c-045d-4579-8961-4efa7e639476', 'https://pwgunyrvtpntsypqcwiq.supabase.co/storage/v1/object/public/review-photos/review_127de46c-045d-4579-8961-4efa7e639476_photo_2.jpg', 2);
```