# Kampo Ibayo Booking System - Testing Documentation

## Testing Strategy Overview

This document outlines the comprehensive testing approach for the Kampo Ibayo Resort booking system, covering manual testing procedures, automated test scenarios, and validation protocols suitable for academic thesis requirements.

## Manual Testing Procedures

### 1. User Registration and Authentication Testing

#### Test Case 1.1: User Registration
**Objective**: Verify new users can successfully register
**Prerequisites**: Clean browser state, valid email address

**Test Steps**:
1. Navigate to `/auth` page
2. Click "Sign Up" tab
3. Enter valid user details:
   - Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "SecurePass123!"
4. Click "Sign up with Email"
5. Check email for verification link
6. Click verification link
7. Verify redirect to main booking page

**Expected Results**:
- Registration form accepts valid inputs
- Email verification sent successfully
- User can log in after verification
- User profile created in database

#### Test Case 1.2: User Login
**Objective**: Verify existing users can log in
**Prerequisites**: Existing user account

**Test Steps**:
1. Navigate to `/auth` page
2. Enter valid credentials
3. Click "Sign in with Email"
4. Verify successful login

**Expected Results**:
- Successful authentication
- Redirect to main booking page
- User session established
- Navigation shows logged-in state

### 2. Booking System Testing

#### Test Case 2.1: Complete Booking Flow
**Objective**: Test end-to-end booking process
**Prerequisites**: Logged-in user, PayMongo test environment

**Test Steps**:
1. Navigate to `/book` page
2. Select check-in date (tomorrow)
3. Select check-out date (3 days from tomorrow)
4. Enter number of guests: 4
5. Fill guest information form:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "+639123456789"
6. Add special requests: "Late check-in"
7. Select pet option if applicable
8. Review booking details
9. Proceed to payment
10. Use PayMongo test card: 4343434343434345
11. Complete payment flow
12. Verify booking confirmation

**Expected Results**:
- All form fields accept valid input
- Date selection works correctly
- Pricing calculation accurate (₱3,500/night)
- Payment processing successful
- Booking confirmation email sent
- Booking status "confirmed" in database
- Admin receives notification

#### Test Case 2.2: Date Availability Validation
**Objective**: Verify availability checking works correctly
**Prerequisites**: Existing booking in database

**Test Steps**:
1. Navigate to booking form
2. Select dates that overlap with existing booking
3. Attempt to proceed with booking
4. Verify availability error message

**Expected Results**:
- System prevents double-booking
- Clear error message displayed
- Alternative dates suggested
- Database integrity maintained

### 3. Payment System Testing

#### Test Case 3.1: Successful Payment Processing
**Objective**: Test PayMongo integration
**Prerequisites**: Valid booking details, test environment

**PayMongo Test Cards**:
- **Visa Success**: 4343434343434345
- **Mastercard Success**: 5555555555554444
- **Declined Card**: 4000000000000002
- **Insufficient Funds**: 4000000000009995

**Test Steps**:
1. Complete booking form
2. Proceed to payment
3. Test each card type
4. Verify payment status updates
5. Check webhook handling

**Expected Results**:
- Successful cards process payment
- Failed cards show appropriate errors
- Payment status updated in real-time
- Email notifications sent correctly

### 4. Admin Dashboard Testing

#### Test Case 4.1: Admin Access Control
**Objective**: Verify admin-only areas are protected
**Prerequisites**: Regular user account, admin account

**Test Steps**:
1. Log in with regular user account
2. Attempt to access `/admin` directly
3. Verify access denied
4. Log in with admin account
5. Verify admin dashboard access

**Expected Results**:
- Regular users cannot access admin areas
- Proper redirect to login page
- Admin users have full access
- Role-based permissions enforced

#### Test Case 4.2: Booking Management
**Objective**: Test admin booking operations
**Prerequisites**: Admin access, existing bookings

**Test Steps**:
1. Navigate to admin bookings page
2. View booking list
3. Filter by status/date
4. Confirm a pending booking
5. Cancel a confirmed booking
6. Verify email notifications sent

**Expected Results**:
- All bookings displayed correctly
- Filtering works as expected
- Status updates successful
- Automated emails triggered
- Database records updated

### 5. Review System Testing

#### Test Case 5.1: Review Submission
**Objective**: Test guest review functionality
**Prerequisites**: Completed booking, logged-in user

**Test Steps**:
1. Navigate to `/review` page
2. Select completed booking
3. Fill review form:
   - Overall rating: 5 stars
   - Cleanliness: 5 stars
   - Comfort: 4 stars
   - Location: 5 stars
   - Service: 5 stars
   - Value: 4 stars
4. Add review text (minimum 50 characters)
5. Upload photos (optional)
6. Submit review

**Expected Results**:
- Form validation works correctly
- Photo upload successful
- Review saved as "pending approval"
- Admin notification sent
- User sees submission confirmation

#### Test Case 5.2: Review Moderation
**Objective**: Test admin review approval process
**Prerequisites**: Admin access, pending reviews

**Test Steps**:
1. Log in as admin
2. Navigate to reviews management
3. Review submitted content
4. Approve appropriate reviews
5. Reject inappropriate content with reason
6. Verify status updates

**Expected Results**:
- Pending reviews visible to admin
- Approval/rejection functions work
- Status updates reflected immediately
- Email notifications sent to reviewers
- Approved reviews appear on public areas

### 6. Email System Testing

#### Test Case 6.1: Email Notifications
**Objective**: Verify all email triggers work correctly
**Prerequisites**: SMTP configuration, test email addresses

**Email Types to Test**:
1. **Booking Confirmation**: After successful payment
2. **Booking Cancellation**: When booking cancelled
3. **Review Approved**: When admin approves review
4. **Review Rejected**: When admin rejects review
5. **Admin Notifications**: New bookings, reviews, cancellations

**Test Steps**:
1. Trigger each email type through system actions
2. Check email delivery (inbox/spam)
3. Verify email content and formatting
4. Test email links functionality

**Expected Results**:
- All emails delivered successfully
- Professional formatting maintained
- All links functional
- Appropriate information included

### 7. Mobile Responsive Testing

#### Test Case 7.1: Mobile Device Compatibility
**Objective**: Verify mobile user experience
**Prerequisites**: Various device screen sizes

**Devices to Test**:
- iPhone 12/13/14 (iOS Safari)
- Samsung Galaxy S21/S22 (Android Chrome)
- iPad (Safari)
- Various screen sizes (320px to 1920px)

**Test Areas**:
1. Navigation menu
2. Booking form
3. Payment process
4. Admin dashboard
5. Review submission

**Expected Results**:
- All features accessible on mobile
- Touch interactions work properly
- Forms remain usable
- Payment process mobile-optimized
- Text remains readable

### 8. Performance Testing

#### Test Case 8.1: Page Load Performance
**Objective**: Verify acceptable loading times
**Prerequisites**: Production environment or realistic test setup

**Metrics to Measure**:
- **First Contentful Paint**: < 2 seconds
- **Largest Contentful Paint**: < 3 seconds
- **Time to Interactive**: < 4 seconds
- **Cumulative Layout Shift**: < 0.1

**Test Steps**:
1. Use Chrome DevTools Performance tab
2. Test on 3G and 4G connections
3. Measure key pages: home, booking, admin
4. Identify performance bottlenecks

**Expected Results**:
- Pages load within acceptable timeframes
- Images optimized and compressed
- JavaScript bundles reasonably sized
- Database queries efficient

### 9. Security Testing

#### Test Case 9.1: Input Validation
**Objective**: Verify system handles malicious input safely
**Prerequisites**: Understanding of common attack vectors

**Test Inputs**:
- SQL Injection attempts in forms
- XSS payloads in text fields
- CSRF token validation
- File upload security
- Authentication bypass attempts

**Test Steps**:
1. Submit malicious payloads in all form fields
2. Attempt to access unauthorized endpoints
3. Test file upload with malicious files
4. Verify error handling

**Expected Results**:
- All inputs properly sanitized
- No SQL injection vulnerabilities
- XSS attempts blocked
- Proper error messages (no system info leaked)
- Authentication enforced consistently

### 10. Data Integrity Testing

#### Test Case 10.1: Database Consistency
**Objective**: Verify data remains consistent across operations
**Prerequisites**: Database access

**Test Scenarios**:
1. Concurrent booking attempts for same dates
2. Payment processing interruptions
3. Review submission with photo uploads
4. User account deletion with existing data

**Validation Steps**:
1. Check foreign key constraints
2. Verify cascade deletions work correctly
3. Test transaction rollbacks
4. Validate data types and constraints

**Expected Results**:
- No orphaned records
- Referential integrity maintained
- Proper error handling for conflicts
- Data consistency across all operations

## Automated Testing Framework

While the current system focuses on manual testing suitable for thesis requirements, here's a framework for potential automated testing:

### Unit Testing Structure
```javascript
// Example test structure for future implementation
describe('Booking System', () => {
  describe('Date Validation', () => {
    test('should reject past dates', () => {
      // Test implementation
    });
    
    test('should calculate correct pricing', () => {
      // Test implementation
    });
  });
  
  describe('Payment Processing', () => {
    test('should handle successful payments', () => {
      // Test implementation
    });
    
    test('should handle payment failures gracefully', () => {
      // Test implementation
    });
  });
});
```

### Integration Testing Approach
```javascript
// Example API endpoint testing
describe('API Endpoints', () => {
  test('POST /api/bookings creates valid booking', async () => {
    // Test implementation
  });
  
  test('GET /api/admin/bookings requires authentication', async () => {
    // Test implementation
  });
});
```

## Test Data Requirements

### Sample User Accounts
```javascript
// Test user accounts needed
const testUsers = {
  admin: {
    email: 'admin@kampoibayo.test',
    password: 'AdminPass123!',
    role: 'admin'
  },
  guest: {
    email: 'guest@example.test',
    password: 'GuestPass123!',
    role: 'user'
  }
};
```

### Sample Booking Data
```javascript
// Test booking scenarios
const testBookings = [
  {
    checkIn: '2024-12-01',
    checkOut: '2024-12-03',
    guests: 4,
    totalAmount: 7000,
    status: 'confirmed'
  },
  {
    checkIn: '2024-12-05',
    checkOut: '2024-12-07',
    guests: 2,
    totalAmount: 7000,
    status: 'pending'
  }
];
```

## Testing Schedule

### Pre-Deployment Testing
1. **Week 1**: Core functionality testing
2. **Week 2**: Payment integration testing
3. **Week 3**: Admin dashboard and review system
4. **Week 4**: Security and performance testing
5. **Week 5**: Mobile and cross-browser testing
6. **Week 6**: Final integration testing

### Post-Deployment Testing
1. **Daily**: Basic functionality checks
2. **Weekly**: Complete booking flow testing
3. **Monthly**: Security and performance review
4. **Quarterly**: Full system regression testing

## Documentation of Test Results

### Test Execution Report Template
```
Test Case ID: TC-2.1
Test Case Name: Complete Booking Flow
Test Date: [Date]
Tester: [Name]
Environment: [Production/Staging]

Pre-conditions Met: ✓
Test Steps Executed: ✓
Expected Results Achieved: ✓
Defects Found: [None/List]
Screenshots: [Attached/None]
Additional Notes: [Any observations]

Overall Result: PASS/FAIL
```

### Bug Report Template
```
Bug ID: BUG-001
Title: [Brief description]
Priority: High/Medium/Low
Severity: Critical/Major/Minor

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result: [What should happen]
Actual Result: [What actually happened]
Environment: [Browser, OS, device]
Screenshots: [If applicable]
Workaround: [If available]
```

## Quality Assurance Metrics

### Success Criteria
- **Functionality**: 100% of core features working
- **Performance**: Page loads < 3 seconds
- **Security**: No critical vulnerabilities
- **Usability**: Mobile-friendly, intuitive interface
- **Reliability**: 99.9% uptime, error rate < 1%

### Test Coverage Goals
- **User Registration/Login**: 100%
- **Booking Process**: 100%
- **Payment Integration**: 100%
- **Admin Functions**: 100%
- **Email System**: 100%
- **Review System**: 100%
- **Security**: 95%
- **Performance**: 90%

---

**Testing Documentation Version**: 1.0  
**Last Updated**: October 2025  
**Compatible With**: Kampo Ibayo Booking System v1.0  
**Review Schedule**: Monthly updates recommended