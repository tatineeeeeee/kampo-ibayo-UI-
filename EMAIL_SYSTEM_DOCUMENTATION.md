# Email Notification System Documentation

## Overview

This document outlines the comprehensive email notification system implemented for the Kampo Ibayo Resort booking platform. The system provides automated email communications for all booking lifecycle events using SMTP with Gmail service integration.

## System Architecture

### Core Technologies
- **Email Service**: Nodemailer v2.x with Gmail SMTP
- **Authentication**: Gmail App Password (2FA required)
- **Templates**: HTML/CSS with inline styling for cross-client compatibility
- **API Integration**: Next.js API routes with TypeScript
- **Database**: Supabase for booking data and status management

### File Structure
```
/app
  /api
    /email
      /booking-confirmation    # Dual email sending for new bookings
      /simple-send            # General purpose email utility
      /test                   # SMTP connection testing
    /admin
      /confirm-booking        # Admin booking confirmation with email
      /cancel-booking         # Admin booking cancellation with email
    /user
      /cancel-booking         # User cancellation with dual notifications
  /utils
    emailService.ts           # Core email functionality and templates
```

### Configuration
```
SMTP Service: Gmail
Port: 587 (TLS)
Authentication: App Password
Admin Email: Environment variable (ADMIN_EMAIL)
From Address: Environment variable (EMAIL_FROM)
```

### Email Template System
- **Responsive Design**: Mobile-friendly HTML with inline CSS
- **Cross-Client Compatibility**: Tested across major email providers
- **Professional Branding**: Consistent Kampo Ibayo Resort styling
- **Status-Based Theming**: Color coding for different email types
- **Accessibility**: High contrast ratios and readable fonts

## Email Templates

The system includes 6 professionally designed email templates with consistent modern styling:

### 1. Booking Confirmation Email
- **Trigger**: Initial booking submission
- **Recipient**: Guest
- **Purpose**: Confirm booking receipt and provide details
- **Design**: Blue theme with booking details grid

### 2. Admin New Booking Notification
- **Trigger**: New booking submitted
- **Recipient**: Admin
- **Purpose**: Alert admin of pending booking requiring action
- **Design**: Green theme with revenue highlights and action buttons

### 3. Booking Confirmed Email
- **Trigger**: Admin confirms pending booking
- **Recipient**: Guest
- **Purpose**: Notify guest of booking approval
- **Design**: Green theme with check-in instructions and celebration banner

### 4. Booking Cancelled by Admin Email
- **Trigger**: Admin cancels a booking
- **Recipient**: Guest
- **Purpose**: Notify guest of cancellation with alternatives
- **Design**: Red theme with apology messaging and refund information

### 5. User Cancellation Confirmation Email
- **Trigger**: Guest cancels their own booking
- **Recipient**: Guest
- **Purpose**: Confirm cancellation and explain next steps
- **Design**: Orange theme with refund timeline and rebooking encouragement

### 6. Admin User Cancellation Notification
- **Trigger**: Guest cancels their booking
- **Recipient**: Admin
- **Purpose**: Alert admin of cancellation with guest's reason
- **Design**: Red theme with revenue impact and recommended actions

## API Endpoints

### Email Testing
```
GET /api/email/test
Purpose: Verify SMTP connection and configuration
Response: Connection status and configuration details
Usage: Health check for email system functionality
```

### Booking Confirmation
```
POST /api/email/booking-confirmation
Purpose: Send booking confirmation to guest and admin notification
Payload: Booking details object with guest information
Functionality: Dual email sending - guest confirmation and admin alert
Response: Success status with message IDs for both emails
```

### Simple Email Sending
```
POST /api/email/simple-send
Purpose: Send basic email notifications
Payload: { to, subject, message }
Usage: General purpose email sending for system notifications
```

### Admin Booking Management

#### Confirm Booking
```
POST /api/admin/confirm-booking
Purpose: Confirm pending booking and send notification to guest
Payload: { bookingId, adminId }
Process: 
  1. Updates booking status from 'pending' to 'confirmed'
  2. Sends confirmation email to guest with check-in details
  3. Returns operation status and email delivery confirmation
Authentication: Admin access required
```

#### Cancel Booking (Admin)
```
POST /api/admin/cancel-booking
Purpose: Cancel booking and send notification to guest
Payload: { bookingId, adminId, reason }
Process:
  1. Updates booking status to 'cancelled'
  2. Records cancellation details (admin, timestamp, reason)
  3. Sends cancellation email to guest with alternatives
  4. Provides refund information and rebooking options
Authentication: Admin access required
```

### User Booking Actions

#### Cancel Booking (User)
```
POST /api/user/cancel-booking
Purpose: Process user-initiated cancellation with dual notifications
Payload: { bookingId, userId, cancellationReason }
Process:
  1. Validates user ownership of booking
  2. Checks cancellation eligibility (24-hour rule for confirmed bookings)
  3. Updates booking status with cancellation details
  4. Sends confirmation email to user
  5. Sends notification email to admin with reason and revenue impact
Security: User can only cancel their own bookings
Business Rules: Automatic cancellation allowed until 24 hours before check-in
```

## Email Service Functions

### Core Infrastructure Functions

#### `createEmailTransporter()`
- **Purpose**: Establishes Gmail SMTP connection with secure authentication
- **Configuration**: Uses environment variables for credentials and settings
- **Security**: Implements TLS encryption and App Password authentication
- **Error Handling**: Includes connection verification and timeout management

#### `sendEmail(emailData)`
- **Purpose**: Universal email sending function with comprehensive error handling
- **Parameters**: EmailTemplate object containing recipient, subject, and content
- **Features**: Automatic retry logic, detailed logging, graceful failure handling
- **Response**: Returns success status with message ID or detailed error information

#### `testEmailConnection()`
- **Purpose**: Validates SMTP connectivity and configuration
- **Usage**: System health checks and troubleshooting
- **Response**: Connection status with diagnostic information

### Email Template Generation Functions

#### `createBookingConfirmationEmail(bookingDetails)`
- **Purpose**: Initial booking receipt confirmation for guests
- **Design**: Blue theme with professional branding
- **Content**: Booking details, contact information, next steps
- **Triggers**: Automatically sent when new booking is submitted

#### `createAdminNotificationEmail(bookingDetails)`
- **Purpose**: Alert administrators of new booking submissions requiring action
- **Design**: Green theme emphasizing revenue opportunity
- **Content**: Booking summary, guest contact, action buttons for admin panel
- **Features**: Revenue highlighting, priority indicators, direct action links

#### `createBookingConfirmedEmail(bookingDetails)`
- **Purpose**: Notification sent when admin approves a pending booking
- **Design**: Green theme with celebration elements
- **Content**: Confirmation details, check-in instructions, preparation guidelines
- **Business Value**: Converts pending reservation to confirmed booking

#### `createBookingCancelledEmail(bookingDetails)`
- **Purpose**: Notification for admin-initiated booking cancellations
- **Design**: Red theme with empathetic messaging
- **Content**: Cancellation details, refund information, alternative options
- **Features**: Apology messaging, rebooking incentives, customer retention focus

#### `createUserCancellationEmail(bookingDetails)`
- **Purpose**: Confirmation for user-initiated booking cancellations
- **Design**: Orange theme indicating status change
- **Content**: Cancellation confirmation, refund timeline, rebooking encouragement
- **Process**: Immediate confirmation with clear next steps

#### `createUserCancellationAdminNotification(bookingDetails, reason)`
- **Purpose**: Alert administrators when guests cancel their bookings
- **Design**: Red theme with operational focus
- **Content**: Cancellation reason, revenue impact, guest contact information
- **Features**: 
  - Revenue loss calculation and display
  - Guest's cancellation reason prominently featured
  - Recommended follow-up actions
  - Contact information for guest retention efforts
- **Business Intelligence**: Helps identify cancellation patterns and improvement opportunities

## Design Principles

### Visual Consistency
- Clean, flat design without gradients or 3D effects
- Light backgrounds with dark text for optimal readability
- Card-based layouts for information organization
- Professional color scheme with status-appropriate theming

### Typography
- Segoe UI font family for cross-platform compatibility
- Clear information hierarchy with proper spacing
- Consistent heading styles and weight distribution
- Accessible contrast ratios throughout

### Responsive Design
- Mobile-friendly layouts that work across email clients
- Inline CSS styling for maximum compatibility
- Flexible grid systems for different screen sizes
- Touch-friendly button sizing and spacing

## Booking Lifecycle Integration

### New Booking Flow
1. User submits booking through web interface
2. Booking stored in Supabase with "pending" status
3. Confirmation email sent to guest
4. Admin notification email sent with booking details
5. Admin reviews and either confirms or cancels

### Confirmation Flow
1. Admin confirms booking through admin panel
2. Booking status updated to "confirmed"
3. Confirmation email sent to guest with check-in details
4. Guest receives detailed instructions and contact information

### Cancellation Flows

#### Admin-Initiated Cancellation
1. Admin cancels booking with reason
2. Booking status updated to "cancelled"
3. Cancellation email sent to guest with alternatives
4. Refund processing information provided

#### User-Initiated Cancellation
1. User cancels through their booking dashboard
2. Cancellation reason captured
3. Booking status updated with cancellation details
4. Confirmation email sent to user
5. Admin notification sent with reason and revenue impact

## Error Handling

### Email Delivery
- SMTP connection verification before sending
- Graceful degradation if email delivery fails
- Booking operations continue even if emails fail
- Detailed error logging for troubleshooting

### API Response Handling
- Success/failure status in all API responses
- Specific error messages for different failure types
- Warning notifications for partial failures
- Retry mechanisms for transient failures

## Security Considerations

### Authentication
- Gmail App Password instead of account password
- Environment variables for sensitive configuration
- No email credentials stored in codebase
- 2FA required for Gmail account

### Data Protection
- Booking data validation before email sending
- User ownership verification for cancellations
- Admin authorization for booking modifications
- No sensitive data in email logs

## Monitoring and Maintenance

### Health Checks
- SMTP connectivity testing endpoint
- Email delivery status tracking
- Template rendering validation
- Database integration verification

### Performance Optimization
- Efficient template rendering
- Minimal external dependencies
- Optimized HTML/CSS for fast loading
- Batch processing capabilities for multiple emails

## Environment Setup

### Required Environment Variables
```
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-gmail-address@gmail.com
EMAIL_FROM_NAME=Kampo Ibayo Resort
ADMIN_EMAIL=admin@kampoibayo.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Dependencies
```json
{
  "nodemailer": "^6.9.7",
  "@types/nodemailer": "^6.4.14"
}
```

## Future Enhancements

### Planned Features
- Email template customization interface
- Bulk email capabilities for marketing
- Advanced analytics and tracking
- Multi-language template support
- SMS integration for critical notifications

### Scalability Considerations
- Email queue system for high volume
- Multiple SMTP provider support
- Template caching for performance
- Automated failover mechanisms

## Business Value and Integration

### Operational Efficiency
- **Automated Communication**: Eliminates manual email sending for all booking operations
- **Real-time Notifications**: Immediate alerts for time-sensitive booking actions
- **Professional Image**: Consistent, branded communication enhances customer trust
- **Audit Trail**: All email communications logged with delivery status

### Customer Experience Enhancement
- **Immediate Confirmation**: Guests receive instant booking acknowledgment
- **Clear Instructions**: Detailed check-in information reduces confusion
- **Transparent Cancellation**: Professional handling of booking changes
- **Alternative Options**: Proactive rebooking suggestions maintain customer relationships

### Administrative Benefits
- **Centralized Management**: All booking communications through unified system
- **Revenue Tracking**: Cancellation impact analysis for business intelligence
- **Guest Retention**: Automated follow-up suggestions for cancelled bookings
- **Workload Reduction**: Automated routine communications free staff for high-value tasks

## Troubleshooting

### Common Issues
- **SMTP Authentication Failures**: Verify App Password and 2FA setup
- **Template Rendering Issues**: Check HTML syntax and inline CSS
- **API Endpoint Errors**: Validate request payloads and authentication
- **Database Connection Issues**: Verify Supabase configuration

### Debugging Steps
1. Test SMTP connection using `/api/email/test` endpoint
2. Verify environment variables are properly set
3. Check email logs for delivery status
4. Validate booking data integrity
5. Review API request/response patterns

## Conclusion

The email notification system provides a robust, professional communication framework for the Kampo Ibayo Resort booking platform. With comprehensive coverage of all booking lifecycle events, modern responsive design, and reliable delivery mechanisms, the system enhances user experience while providing administrators with necessary operational visibility.

The modular architecture allows for easy maintenance and future enhancements while maintaining security and performance standards appropriate for a production booking system.