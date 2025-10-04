# Homepage Review Display - Best Practices for Resort Websites

## Industry Standards

### **Optimal Number: 3-6 Reviews**

## Research-Based Recommendations

### **3 Reviews (Recommended for Small Resorts)**
✅ **Best for**: Small boutique resorts, vacation rentals
✅ **Benefits**: 
- Quick to scan
- High-quality curation
- Mobile-friendly
- Loads fast

### **4 Reviews (Sweet Spot)**
✅ **Best for**: Mid-size resorts
✅ **Benefits**:
- Perfect balance of variety and focus
- Good for desktop/mobile
- Even grid layout (2x2)

### **6 Reviews (Maximum Recommended)**
✅ **Best for**: Large resorts with many amenities
✅ **Benefits**:
- Shows diverse experiences
- 3x2 or 2x3 grid layout
- Still manageable to read

## What Top Platforms Do

### **Airbnb**: 3 reviews on property pages
### **Booking.com**: 3-4 reviews on hotel pages
### **TripAdvisor**: 4-5 reviews on main view
### **Hotels.com**: 3 reviews prominently displayed

## Layout Strategies

### **3 Reviews Layout:**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Review 1  │ │   Review 2  │ │   Review 3  │
│   ⭐⭐⭐⭐⭐    │ │   ⭐⭐⭐⭐⭐    │ │   ⭐⭐⭐⭐⭐    │
│   [Photo]   │ │   [Photo]   │ │   [Photo]   │
│   "Amazing" │ │   "Perfect" │ │   "Loved"   │
│   - Sarah   │ │   - Mike    │ │   - Lisa    │
└─────────────┘ └─────────────┘ └─────────────┘
```

### **4 Reviews Layout:**
```
┌─────────────┐ ┌─────────────┐
│   Review 1  │ │   Review 2  │
│   ⭐⭐⭐⭐⭐    │ │   ⭐⭐⭐⭐⭐    │
└─────────────┘ └─────────────┘
┌─────────────┐ ┌─────────────┐
│   Review 3  │ │   Review 4  │
│   ⭐⭐⭐⭐⭐    │ │   ⭐⭐⭐⭐⭐    │
└─────────────┘ └─────────────┘
```

## Selection Criteria for Homepage Reviews

### **Quality Over Quantity**
1. **5-star reviews only** (perfect ratings)
2. **Must have photos** (visual appeal)
3. **Substantive text** (not just "great!")
4. **Recent reviews** (within 6 months)
5. **Diverse experiences** (different guest types)

### **Strategic Mix:**
- **1 Family Review**: "Perfect for kids..."
- **1 Couple Review**: "Romantic getaway..."
- **1 Group Review**: "Amazing for our reunion..."

## Implementation for Your Resort

### **Recommended: 4 Reviews**

**Why 4 is perfect for you:**
- ✅ Shows variety without overwhelming
- ✅ Even grid layout looks professional
- ✅ Enough space for photos + text
- ✅ Mobile responsive (2x2 → 1x4)

### **Database Implementation:**

```sql
-- Add featured column for homepage selection
ALTER TABLE guest_reviews ADD COLUMN featured BOOLEAN DEFAULT false;
ALTER TABLE guest_reviews ADD COLUMN featured_order INTEGER;

-- Update to feature best reviews
UPDATE guest_reviews 
SET featured = true, featured_order = 1 
WHERE id = 'your-best-review-id-1';

-- Query for homepage
SELECT * FROM guest_reviews 
WHERE approved = true AND featured = true 
ORDER BY featured_order ASC 
LIMIT 4;
```

### **Homepage Component Logic:**

```tsx
const HomepageReviews = () => {
  const [featuredReviews, setFeaturedReviews] = useState([]);
  
  useEffect(() => {
    const fetchFeaturedReviews = async () => {
      const { data } = await supabase
        .from('guest_reviews')
        .select(`
          *,
          review_photos (photo_url, display_order)
        `)
        .eq('approved', true)
        .eq('featured', true)
        .order('featured_order')
        .limit(4);
      
      setFeaturedReviews(data);
    };
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          What Our Guests Say
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/reviews" className="btn-primary">
            Read All Reviews
          </Link>
        </div>
      </div>
    </section>
  );
};
```

## Admin Interface Enhancement

### **Featured Review Management:**

```tsx
// Add to admin interface
{review.approved && (
  <>
    <button
      onClick={() => toggleFeatured(review.id, !review.featured)}
      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
        review.featured 
          ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
          : 'bg-gray-100 text-gray-600 border-gray-300'
      }`}
    >
      <Star className="w-3 h-3 mr-1" />
      {review.featured ? 'Featured' : 'Feature'}
    </button>
  </>
)}
```

## Content Guidelines

### **Perfect Homepage Review:**
- **Length**: 50-150 words
- **Rating**: 5 stars only
- **Photos**: 1-2 high-quality images
- **Content**: Specific details, emotional language
- **Guest**: Real name, location

### **Example Perfect Review:**
```
"Perfect family getaway! The kids loved the pool and game room 
while we enjoyed the peaceful garden area. The staff went above 
and beyond to make our anniversary special. The rooms were 
spotless and the location is ideal for exploring the area. 
Already booked our next stay!"
⭐⭐⭐⭐⭐ - Sarah & Mike Johnson, Austin TX
[2 beautiful photos of pool and garden]
```

## Performance Considerations

### **Loading Strategy:**
- **Lazy load photos** below the fold
- **Preload first 2 reviews** for speed
- **Cache reviews** for 24 hours
- **Optimize images** (WebP, responsive)

## Rotation Strategy

### **Monthly Review Rotation:**
- Keep 2 evergreen "hero" reviews
- Rotate 2 seasonal reviews monthly
- Always feature recent reviews (within 3 months)
- Update photos seasonally

**Bottom Line: 4 carefully curated, recent, 5-star reviews with photos is the sweet spot for homepage display. Quality over quantity always wins!**