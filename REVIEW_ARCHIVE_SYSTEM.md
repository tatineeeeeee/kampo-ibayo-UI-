# Review Archive System - Real Implementation

## Current Problem
❌ "Archive" button just sets `approved = false`
❌ No real archive - reviews just get rejected
❌ No way to distinguish between rejected and archived reviews

## Recommended Database Schema Update

```sql
-- Add proper status column to replace the simple approved boolean
ALTER TABLE guest_reviews ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE guest_reviews ADD COLUMN archived_at TIMESTAMP;
ALTER TABLE guest_reviews ADD COLUMN archived_reason TEXT;

-- Update existing data
UPDATE guest_reviews SET status = 'approved' WHERE approved = true;
UPDATE guest_reviews SET status = 'rejected' WHERE approved = false;
UPDATE guest_reviews SET status = 'pending' WHERE approved IS NULL;
```

## Proper Review States

### 1. **PENDING** (initial state)
- Just submitted by guest
- Awaiting admin review
- Not visible to public

### 2. **APPROVED** (live and active)
- Reviewed and approved by admin
- Visible on website
- Can be featured on homepage

### 3. **REJECTED** (permanently hidden)
- Admin determined inappropriate
- Not visible anywhere
- With rejection reason

### 4. **ARCHIVED** (soft delete)
- Was approved but now hidden
- Reasons: outdated, replaced, quality issues
- Keeps data for analytics
- Can be restored if needed

## Where Archived Reviews Go

### Database:
```sql
-- Archived reviews query
SELECT * FROM guest_reviews 
WHERE status = 'archived' 
ORDER BY archived_at DESC;
```

### Admin Interface:
```
Review Management Tabs:
[Pending] [Approved] [Rejected] [Archived]
                                    ↑
                           Shows archived reviews
```

### User Experience:
- **Public**: Can't see archived reviews
- **Admin**: Can view in "Archived" tab
- **Analytics**: Count in historical data
- **Restore**: Admin can un-archive if needed

## Better Button Actions

### For Approved Reviews:
```tsx
// Instead of just "Archive"
<button onClick={() => archiveReview(review.id, 'outdated')}>
  📁 Archive (Outdated)
</button>

<button onClick={() => archiveReview(review.id, 'quality')}>
  📁 Archive (Quality)
</button>

<button onClick={() => archiveReview(review.id, 'replaced')}>
  📁 Archive (Replaced)
</button>
```

## Implementation Example

```tsx
const archiveReview = async (reviewId: string, reason: string) => {
  const { error } = await supabase
    .from('guest_reviews')
    .update({ 
      status: 'archived',
      archived_at: new Date().toISOString(),
      archived_reason: reason
    })
    .eq('id', reviewId);
};

const restoreReview = async (reviewId: string) => {
  const { error } = await supabase
    .from('guest_reviews')
    .update({ 
      status: 'approved',
      archived_at: null,
      archived_reason: null
    })
    .eq('id', reviewId);
};
```

## Admin Dashboard Sections

### 1. **Active Reviews** (approved, visible to guests)
### 2. **Pending Reviews** (need admin action)
### 3. **Rejected Reviews** (inappropriate content)
### 4. **Archived Reviews** (hidden but preserved)
   - View archive reason
   - Restore to active
   - Permanently delete

## Benefits

✅ **Clear separation** between rejected and archived
✅ **Data preservation** for analytics
✅ **Restore capability** for archived reviews
✅ **Audit trail** with archive reasons and timestamps
✅ **Professional workflow** like major platforms

## Quick Fix for Now

If you want to implement this properly, you'd need to:

1. Add the status column to your database
2. Update the admin interface to use status instead of approved
3. Add archive functionality with reasons
4. Create an "Archived" tab in admin

For now, your "Archive" button just moves reviews back to rejected state, which isn't ideal but functional.