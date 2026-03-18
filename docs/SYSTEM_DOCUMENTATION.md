# Kampo Ibayo Resort - Booking System Documentation

## Overview

A complete web-based booking management system built specifically for **Kampo Ibayo Resort** - a small eco-friendly camping resort in General Trias, Cavite, Philippines. The system handles all aspects of resort operations from guest bookings to admin management.

## System Specifications

### Resort Capacity
- **Maximum Guests**: 15 people
- **Accommodations**: 2 poolside AC family rooms + camping area + treehouse
- **Operating Model**: Single resort, family-friendly operation
- **Pricing**: Dynamic (weekday ₱9,000 / weekend ₱12,000)

### Technical Stack
- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Payments**: PayMongo (GCash, Cards)
- **Email**: Nodemailer with Gmail SMTP
- **Hosting**: Vercel (recommended)

## Core Features

### 1. Guest Booking System
- **Real-time availability checking** with visual calendar
- **Dynamic pricing** based on dates and guest count
- **Conflict prevention** - prevents double bookings
- **Guest information collection** (name, email, phone, special requests)
- **Pet-friendly options** with no additional cost
- **PayMongo integration** for secure payments

### 2. Admin Management Dashboard
- **Booking oversight** - view, confirm, cancel all reservations
- **User management** - guest accounts and admin controls  
- **Financial reporting** - revenue tracking, payment status
- **Daily operations** - arrival/departure lists, cleaning schedules
- **Guest communication** - email notifications for all booking events
- **Maintenance mode** - temporarily close resort for repairs

### 3. Guest Portal
- **My Bookings** - view booking history and status
- **Profile management** - update personal information
- **Booking cancellation** - self-service with email notifications
- **Review system** - leave reviews after stays (with admin approval)
- **Real-time updates** - booking status changes reflected immediately

### 4. Communication System
- **Automated emails** for booking confirmations, cancellations, admin notifications
- **Admin alerts** when guests book or cancel
- **Guest notifications** when bookings are confirmed/cancelled by admin
- **Professional email templates** with resort branding

## Database Structure

### Key Tables
- **bookings** - Guest reservations with dates, amounts, status
- **users** - Guest accounts and admin users
- **guest_reviews** - Customer reviews with photo uploads
- **maintenance_settings** - Resort operational status

### Booking Statuses
- **pending** - New booking awaiting admin confirmation
- **confirmed** - Approved booking ready for guest arrival
- **cancelled** - Cancelled by guest or admin
- **completed** - Past stay finished

## User Roles

### Guests
- Create account and manage profile
- Make bookings and payments
- View booking history
- Cancel reservations
- Submit reviews after stays

### Admin
- Full system access
- Manage all bookings (confirm/cancel)
- User account management
- Financial reporting and analytics
- System settings and maintenance mode

## Payment Processing

### PayMongo Integration
- **Test Mode**: Currently configured for development/demonstration
- **Supported Methods**: GCash, Credit/Debit Cards
- **Security**: PCI-compliant payment processing
- **Flow**: Payment intent → Payment method → Checkout redirect

### Pricing Logic
```javascript
Weekend/Holiday: ₱12,000 (Fri-Sun + holidays)
Weekday: ₱9,000 (Mon-Thu)
Extra guests: ₱500 per person above 15
```

## Operational Features

### Daily Operations
- **Arrival List** - Today's check-ins with guest details
- **Departure List** - Today's check-outs for cleaning schedule
- **Guest Registry** - Contact database for communication
- **Revenue Reports** - Earnings for accounting/tax purposes

### Booking Management
- **Capacity Control** - Maximum 2 bookings per day (same-day turnover allowed)
- **Conflict Detection** - Prevents overlapping reservations
- **Cancellation Tracking** - Records who cancelled and when
- **Guest Limits** - Enforces 3 pending bookings per user maximum

## Security Features

### Authentication
- **Supabase Auth** - Industry-standard user authentication
- **Role-based Access** - Separate guest and admin permissions
- **Session Management** - Secure login/logout functionality

### Data Protection
- **Row-level Security** - Users can only access their own data
- **API Security** - Protected admin routes
- **Input Validation** - Prevents malicious data entry

## Maintenance & Operations

### System Administration
- **Maintenance Mode** - Disable bookings during resort repairs
- **User Deactivation** - Disable problematic user accounts
- **Booking Expiration** - Auto-expire old pending bookings
- **Database Cleanup** - Remove old completed bookings

### Monitoring
- **Error Handling** - Graceful failure management
- **Email Delivery** - Notification success/failure tracking
- **Payment Status** - Real-time payment processing updates

## File Structure

```
kampo-ibayo/
├── app/
│   ├── admin/              # Admin dashboard pages
│   │   ├── bookings/       # Booking management
│   │   ├── users/          # User management  
│   │   ├── reports/        # Analytics & reports
│   │   └── settings/       # System settings
│   ├── api/                # Backend API endpoints
│   │   ├── admin/          # Admin operations
│   │   ├── email/          # Email notifications
│   │   ├── paymongo/       # Payment processing
│   │   └── user/           # User operations
│   ├── book/               # Guest booking interface
│   ├── bookings/           # User booking management
│   ├── components/         # Reusable UI components
│   └── utils/              # Helper functions
├── public/                 # Static assets (images, icons)
└── database.types.ts       # TypeScript database definitions
```

## Deployment

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
PAYMONGO_SECRET_KEY=your_paymongo_key
GMAIL_USER=kampoibayo@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### Recommended Hosting
- **Vercel** - Automatic deployments from GitHub
- **Domain**: kampoibayo.com (or similar)
- **SSL**: Automatic HTTPS encryption

## Business Integration

### Resort Operations
- **Check-in**: 3:00 PM (manual process with digital booking confirmation)
- **Check-out**: 1:00 PM (triggers cleaning tasks in system)
- **Capacity**: 15 guests maximum (system enforces limit)
- **Booking Window**: Up to 2 years in advance

### Contact Integration
- **Phone**: +63 966 281 5123
- **Email**: kampoibayo@gmail.com
- **Address**: 132 Ibayo, Brgy Tapia, General Trias, Cavite
- **Facebook**: Kampo Ibayo (for social media presence)

## Future Enhancements

### Potential Additions (Post-Launch)
- **SMS notifications** for booking reminders
- **Online check-in forms** to streamline arrival process
- **Photo gallery management** for admin to update resort images
- **Guest loyalty program** for repeat visitors
- **Calendar export** to integrate with external calendars

### System Maintenance
- **Regular backups** of booking and user data
- **Software updates** for security and features
- **Payment gateway updates** as needed
- **Performance monitoring** for optimal user experience

## Support & Maintenance

### Technical Support
- **System Issues**: Contact development team
- **Payment Problems**: PayMongo support + admin intervention
- **Email Delivery**: Gmail/SMTP configuration check
- **Database Issues**: Supabase dashboard monitoring

### User Support
- **Guest Questions**: Phone/email direct to resort
- **Booking Changes**: Admin dashboard management
- **Cancellations**: Self-service through user portal
- **Technical Problems**: System status page + direct contact

---

**System Status**: Production Ready  
**Last Updated**: October 2025  
**Version**: 1.0  
**Built for**: Kampo Ibayo Resort, General Trias, Cavite