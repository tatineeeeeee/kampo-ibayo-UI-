# Photo Storage Guidelines for Review System

## Current Status ✅
- Photos are successfully stored in Supabase Storage
- Photos are properly linked in review_photos table
- System is working correctly

## Supabase Storage Limits

### Free Tier Limits:
- **Storage**: 1 GB total
- **Bandwidth**: 2 GB per month
- **File size**: 50 MB per file (recommended max)

### Pro Tier Limits:
- **Storage**: 100 GB included
- **Bandwidth**: 200 GB per month
- **File size**: No official limit (but 50-100 MB recommended)

## Recommended Photo Limits for Review System

### Per Review:
- **Minimum**: 1 photo
- **Recommended**: 3-5 photos
- **Maximum**: 6-8 photos
- **File size**: 1-5 MB per photo (after compression)

### File Format & Size Optimization:
```javascript
// Recommended settings in your upload component
const PHOTO_LIMITS = {
  maxPhotos: 5,           // Maximum photos per review
  maxFileSize: 5 * 1024 * 1024, // 5MB per file
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  recommendedDimensions: {
    width: 1200,          // Max width in pixels
    height: 1200,         // Max height in pixels
    quality: 0.8          // JPEG quality (80%)
  }
};
```

## Storage Calculation

### Example with current setup:
- **3 photos per review** × **2MB average** = **6MB per review**
- **100 reviews with photos** = **600MB total**
- **500 reviews with photos** = **3GB total** (would need Pro tier)

### Monitoring Queries:
```sql
-- Count total photos in system
SELECT COUNT(*) as total_photos FROM review_photos;

-- Average photos per review
SELECT AVG(photo_count) as avg_photos_per_review
FROM (
  SELECT review_id, COUNT(*) as photo_count 
  FROM review_photos 
  GROUP BY review_id
) stats;

-- Reviews with most photos (to identify outliers)
SELECT 
  rp.review_id,
  gr.guest_name,
  COUNT(*) as photo_count
FROM review_photos rp
JOIN guest_reviews gr ON rp.review_id = gr.id
GROUP BY rp.review_id, gr.guest_name
ORDER BY photo_count DESC
LIMIT 10;
```

## Recommendations for Your System

### 1. Implement Photo Limits in Frontend:
- **Max 5 photos per review** (good balance)
- **Compress images before upload**
- **Resize large images to max 1200px**

### 2. Storage Management:
- **Monitor usage monthly**
- **Implement image compression**
- **Consider cleanup for rejected reviews**

### 3. User Experience:
- **3-5 photos is optimal** for showcasing stays
- **Too many photos** can overwhelm viewers
- **High quality** is better than quantity

## Current Photo Limits in Your Code

Let me check your current implementation: