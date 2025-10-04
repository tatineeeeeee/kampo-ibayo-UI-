# Review Photos Storage Setup Instructions

## To enable review photo uploads, you need to create a storage bucket in Supabase:

### Steps:
1. Go to your Supabase Dashboard
2. Navigate to Storage section
3. Click "Create a new bucket"
4. Set bucket name: `review-photos`
5. Set bucket to **Public**: ✅ (checked)
6. File size limit: `5MB`
7. Allowed MIME types: `image/jpeg, image/png, image/webp`

### Storage Policies:
The storage policies will be automatically created when you create the bucket. If needed, you can manually add:

**Policy for uploads (authenticated users):**
```sql
(bucket_id = 'review-photos') AND (auth.role() = 'authenticated')
```

**Policy for public access (anyone can view):**
```sql
bucket_id = 'review-photos'
```

### Database Setup:
Run the SQL file `setup_review_photos_storage.sql` to create the review_photos table with proper schema.

### Current Status:
✅ Frontend photo upload UI implemented
✅ Photo storage logic in ReviewSubmissionForm
✅ Photo display in ReviewSystem component  
✅ Database schema ready
⏳ Storage bucket needs manual creation

Once the storage bucket is created, users will be able to upload up to 3 photos with their reviews, and these photos will be displayed on the main page review cards.