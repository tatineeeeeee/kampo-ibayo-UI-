# Real-Time User Deactivation System

This system ensures that when an admin deletes a user, that user is immediately blocked from all activities, even if they're currently logged in.

## How It Works

### 1. **Auth Guard Hook** (`/hooks/useAuthGuard.tsx`)
- Automatically checks if user exists in database on page load
- Shows loading state while checking
- Displays deactivation message if user is deleted
- Forces logout and redirect to login page

### 2. **Action Validation** (`/utils/userValidation.ts`)
- Validates user existence before important actions (booking, profile updates, etc.)
- Can be used to wrap functions or called directly
- Automatically logs out deleted users

### 3. **Protected Pages**
Already protected with auth guards:
- **Homepage** (`/`) - Checks user validity on load
- **Booking Page** (`/book`) - Validates user before allowing reservations
- **Profile Page** (`/profile`) - Ensures user exists before showing profile

## What Happens When User is Deleted

### Scenario: User is browsing the site when admin deletes their account

1. **Immediate Protection**: Any protected page will check user validity
2. **Action Blocking**: Attempts to book, update profile, etc. are blocked
3. **Automatic Logout**: User session is terminated
4. **User-Friendly Message**: "Your account has been deactivated by an administrator"
5. **Redirect**: User is sent to login page

## How to Protect Additional Pages

### Method 1: Wrap entire page component
```tsx
import { withAuthGuard } from "../hooks/useAuthGuard";

function MyPage() {
  // Your page content
}

export default withAuthGuard(MyPage);
```

### Method 2: Validate before specific actions
```tsx
import { validateUserAction } from "../utils/userValidation";

const handleImportantAction = async () => {
  const validation = await validateUserAction();
  if (!validation.isValid) {
    return; // User will be redirected automatically
  }
  
  // Proceed with action
  // ...
};
```

### Method 3: Wrap async functions
```tsx
import { withUserValidation } from "../utils/userValidation";

const safeBooking = withUserValidation(createBooking);
```

## Admin Experience

When you delete a user:
1. User is removed from database ✅
2. User's auth account is deleted (if possible) ✅
3. User gets immediate "account deactivated" message ✅
4. User is logged out and redirected ✅
5. User cannot perform any actions ✅

## User Experience

Deleted users will see:
- 🚫 **Clear Message**: "Account Deactivated"
- 📝 **Explanation**: "Your account has been deactivated by an administrator"
- 🔄 **Action Button**: "Go to Login"
- 🚪 **Automatic Logout**: Session terminated immediately

## Technical Features

- ✅ **Real-time validation**
- ✅ **Automatic session cleanup**
- ✅ **User-friendly error messages**
- ✅ **Graceful degradation**
- ✅ **TypeScript support**
- ✅ **No page refresh needed**

This ensures deleted users cannot continue using your application, providing immediate security and a professional user experience! 🔐