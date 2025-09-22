# Auto-Expiration System Documentation

## 7-Day Auto-Expiration System for Bookings

### How it works:

1. **Automatic Check**: Every time a user loads the bookings page, the system automatically checks for pending bookings older than 7 days.

2. **Auto-Expiration**: Bookings that are "pending" for 7+ days are automatically changed to "expired" status.

3. **Warning System**: Bookings that are pending for 5+ days show a warning message to the user.

4. **Visual Indicators**: 
   - Orange warning badges for expiring bookings
   - Orange "expired" status badges
   - Clear expiration messages

### Features Added:

#### In `app/utils/bookingUtils.ts`:
- `checkAndExpirePendingBookings()` - Main function that finds and expires old bookings
- `getDaysPending()` - Calculates how many days a booking has been pending
- `shouldShowExpirationWarning()` - Determines if warning should be shown (5+ days)
- `getExpirationWarningMessage()` - Gets the warning message text
- `manuallyExpireBookings()` - Manual function for testing/admin use

#### In `app/bookings/page.tsx`:
- Auto-expiration check runs when bookings are loaded
- Warning messages shown on booking cards
- "Expired" status support in status icons and colors
- Expired bookings cannot be cancelled
- Detailed expiration info in booking modal

### Booking Statuses:
- **Pending**: Newly created booking (0-6 days)
- **Pending (Warning)**: Booking about to expire (5-6 days)
- **Expired**: Auto-expired booking (7+ days)
- **Confirmed**: Admin approved and/or payment received
- **Cancelled**: Manually cancelled by user or admin

### For Your Capstone:
This system demonstrates:
- Automated business logic
- User experience improvements
- Professional booking management
- Real-world hotel/resort functionality

### Testing:
To test the system, you can temporarily change the 7-day limit to 1 day in the code, create a booking, and see it auto-expire after a day.