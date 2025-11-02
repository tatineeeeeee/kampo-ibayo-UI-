# THE KAMPO WAY: USER MANUAL
## A Comprehensive Guide to Kampo Ibayo Booking and Reservation System

**Project**: The Kampo Way - Booking and Reservation System for Kampo Ibayo in General Trias, Cavite  
**Team**: DAI REN B. DACASIN, JUSTINE CESAR L. OCAMPO, JOHN REIGN REYES  
**Version**: 2.0 (November 2025)  
**System**: Next.js 15.5.2 with React 19.1.0 and Supabase Database

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Guest User Guide](#guest-user-guide)
3. [Admin User Guide](#admin-user-guide)
4. [Advanced Features](#advanced-features)
5. [Mobile App Experience](#mobile-app-experience)
6. [Troubleshooting](#troubleshooting)
7. [System Features](#system-features)

---

## Getting Started

### System Requirements
- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Internet Connection**: Stable internet connection required
- **Mobile Support**: Fully responsive on smartphones and tablets

### Accessing the System
1. Open your web browser
2. Navigate to: **[Your Domain Here]** (e.g., kampoibayo.com)
3. The homepage will display with booking options

### Creating an Account
1. Click **"Login"** in the top navigation or home button
2. Click **"Sign Up"** tab in the authentication modal
3. Fill in your information with validation:
   - **Full Name**: Required, minimum 2 characters
   - **Email Address**: Must be valid format, will be verified
   - **Password**: Minimum 8 characters with complexity requirements
   - **Phone Number**: Philippine format validation (+63 9XX XXX XXXX)
4. **Password Requirements**:
   - At least 8 characters long
   - Must contain uppercase and lowercase letters
   - Must include at least one number
   - Special characters recommended
5. Click **"Create Account"** 
6. **Email Verification Process**:
   - Check your email inbox (and spam folder)
   - Click verification link within 24 hours
   - Account activated automatically upon verification
7. **Role Assignment**: New accounts are automatically assigned "guest" role with booking privileges

---

## Guest User Guide

### Making a Booking

#### Step 1: Check Availability
1. On the homepage, click **"Check Availability"** or **"Book Your Stay"**
2. You'll see a calendar showing:
   - 🟢 **Available dates** (white/gray)
   - 🔵 **Check-in dates** (green - guests arriving)
   - 🔴 **Check-out dates** (red - guests departing)
   - 🟡 **Occupied dates** (yellow - resort full)
   - 🟣 **Full day bookings** (purple - same-day arrival/departure)

#### Step 2: Select Your Dates
1. Click on your desired **check-in date**
2. Click on your desired **check-out date**
3. Selected dates will be highlighted in blue
4. Pricing will automatically calculate based on:
   - Weekday: ₱9,000 (Monday-Thursday)
   - Weekend/Holiday: ₱12,000 (Friday-Sunday + holidays)
   - Extra guests: ₱500 per person above 15

#### Step 3: Enter Guest Information
1. **Personal Details**:
   - Full Name (auto-filled from your profile)
   - Email Address (auto-filled from your profile)
   - Phone Number (recommended for contact)

2. **Booking Details**:
   - Number of Guests (1-25, standard rate covers 15)
   - Pet Information (check if bringing pets - no extra charge)
   - Special Requests (dietary needs, accessibility, celebrations)

#### Step 4: Review and Pay
1. **Review Booking Summary**:
   - Check-in/Check-out dates and times (2:00 PM - 12:00 PM)
   - Total amount breakdown with detailed pricing
   - Guest count and any additional fees (₱500 per extra guest above 15)
   - Pet accommodation status (no extra charge)
   - Special requests confirmation
2. **Payment Options**:
   - **Online Payment**: PayMongo integration (GCash, Cards, Bank Transfer)
   - **Manual Payment**: Bank transfer with proof upload
   - **On-site Payment**: Cash payment upon check-in (limited availability)
3. **Online Payment Process**:
   - Click **"Pay Now"** for instant processing
   - Choose payment method in PayMongo gateway
   - Complete payment securely with encryption
   - Automatic booking confirmation upon successful payment
4. **Manual Payment Process**:
   - Click **"Upload Payment Proof"**
   - Transfer to provided bank account details
   - Upload clear photo of transaction receipt
   - Wait for admin verification (within 24 hours)

#### Step 5: Confirmation
1. You'll receive immediate email confirmation
2. Your booking status will be **"Pending"** until admin approval
3. Admin will confirm within 24 hours
4. You'll receive another email when confirmed

### Managing Your Bookings

#### Viewing Your Bookings
1. Log in to your account
2. Click your profile icon → **"My Bookings"**
3. You'll see all your reservations with status:
   - **Pending**: Awaiting admin confirmation
   - **Confirmed**: Approved and ready
   - **Cancelled**: Cancelled by you or admin
   - **Completed**: Past stays

#### Cancelling a Booking
1. Go to **"My Bookings"**
2. Find the booking you want to cancel
3. Click **"Cancel Booking"**
4. Provide cancellation reason (optional)
5. Confirm cancellation
6. You'll receive email confirmation
7. Refund processed according to cancellation policy:
   - 60+ days: 90% refund
   - 30-59 days: 75% refund
   - 7-29 days: 50% refund
   - Less than 7 days: 25% refund

#### Modifying Bookings
Currently, date changes require cancellation and rebooking. Contact resort directly for special circumstances: +63 945 277 9541

### Leaving Reviews

#### Eligibility
- Only guests with **completed stays** can leave reviews
- One review per booking
- Reviews must be submitted within reasonable time after stay

#### Submitting a Review
1. Go to **"My Bookings"**
2. Find your completed stay
3. Click **"Leave Review"**
4. Fill out the review form:
   - **Rating**: 1-5 stars (required)
   - **Review Text**: Detailed feedback (required)
   - **Photos**: Upload up to 5 photos (optional)
   - **Guest Name**: How you want to appear (auto-filled)
   - **Location**: City/province (optional)
   - **Anonymous Option**: Hide your name if preferred

#### Review Process
1. Your review is submitted for admin approval
2. Status will show **"Under Review"**
3. Admin will approve or request revisions within 48 hours
4. If approved: Review appears on website
5. If rejected: You can revise and resubmit (2 attempts maximum)

### Profile Management

#### Updating Your Profile
1. Click profile icon → **"Profile"** or **"My Profile"**
2. Update your information:
   - Name
   - Email address
   - Phone number
   - Password (if needed)
3. Click **"Save Changes"**

#### Account Security
- Use a strong password (8+ characters, mix of letters/numbers)
- Don't share your login credentials
- Log out when using shared computers
- Contact support if you suspect account compromise

---

## Admin User Guide

### Admin Dashboard Overview

#### Accessing Admin Panel
1. Log in with admin credentials
2. You'll be automatically redirected to the admin dashboard
3. Admin navigation includes:
   - **Dashboard**: Overview and statistics
   - **Bookings**: Manage all reservations
   - **Users**: Manage guest accounts
   - **Reports**: Generate operational reports
   - **Reviews**: Manage guest reviews
   - **Settings**: System configuration

### Managing Bookings

#### Daily Operations
1. **Dashboard Overview**:
   - Today's arrivals and departures
   - Pending bookings requiring attention
   - Revenue statistics
   - Occupancy rates

2. **Booking Management**:
   - View all bookings with filters (status, date range)
   - Detailed booking information including guest contact
   - Quick actions for confirm/cancel

#### Confirming Bookings
1. Go to **Bookings** → **Pending** tab
2. Click on a pending booking to view details
3. Verify booking information and payment status
4. Click **"Confirm Booking"**
5. Guest receives automatic confirmation email
6. Booking status changes to "Confirmed"

#### Cancelling Bookings
1. Find the booking in **Bookings** section
2. Click **"Cancel Booking"**
3. Provide cancellation reason
4. Select who initiated cancellation (admin/guest)
5. Confirm action
6. Guest receives cancellation notification
7. Handle refund processing manually if payment was made

### User Management

#### Viewing User Accounts
1. Go to **Users** section
2. View all guest accounts with:
   - Registration date
   - Contact information
   - Booking history
   - Account status

#### Managing Problem Users
1. **Deactivate Account**: Prevent user from making new bookings
2. **View History**: Check past bookings and behavior
3. **Contact Information**: Direct communication if needed

### Reports and Analytics

#### Daily Operations Report
1. Go to **Reports**
2. Select **"Daily Checklist"**
3. View/export today's:
   - Guest arrivals with contact info
   - Guest departures (cleaning schedule)
   - Resort preparation tasks

#### Guest Registry
1. Select **"Guest Registry"**
2. Export complete guest database for:
   - Email marketing
   - Contact for emergencies
   - Customer relationship management

#### Financial Reports
1. Select **"Revenue Summary"**
2. Export earnings data for:
   - Accounting purposes
   - Tax preparation
   - Business analysis

### Review Management

#### Reviewing Guest Submissions
1. Go to **Reviews** section
2. **Pending Reviews** tab shows submissions awaiting approval
3. For each review:
   - Read review content and rating
   - View uploaded photos
   - Check guest booking verification
   - Decide: Approve or Request Changes

#### Approval Process
1. Click **"Approve"** for acceptable reviews
2. For problematic reviews, click **"Request Changes"**
3. Provide specific feedback on what needs improvement
4. Guest can revise and resubmit (maximum 2 attempts)

#### Review Quality Guidelines
**Approve reviews that are:**
- Honest and constructive
- Specific about their experience
- Appropriate language and content
- Relevant to the resort experience

**Request changes for reviews that:**
- Contain inappropriate language
- Include false information
- Are too vague or unhelpful
- Violate privacy of other guests

### System Settings

#### Maintenance Mode
1. Go to **Settings**
2. **Resort Operations** section
3. Toggle **"Enable Maintenance Mode"**
4. Customize maintenance message
5. This will:
   - Disable new bookings
   - Display maintenance notice on homepage
   - Allow existing bookings to continue

#### General Settings
- Update resort contact information
- Modify booking policies
- Adjust system notifications
- Configure email templates

---

## Advanced Features

### AI-Powered Chatbot Support
**Location**: Bottom-right corner of every page

#### Features:
1. **24/7 Availability**: Instant responses to common questions
2. **Booking Assistance**: Step-by-step guidance through reservation process
3. **FAQ Integration**: Automated answers to frequently asked questions
4. **Escalation System**: Connects to human support when needed

#### Using the Chatbot:
1. Click the chat bubble icon
2. Type your question in natural language
3. Receive instant automated responses
4. Follow suggested actions or ask follow-up questions
5. Request human assistance for complex issues

### Review and Rating System
**Comprehensive Guest Feedback Platform**

#### Review Categories:
1. **Overall Experience** (1-5 stars)
2. **Cleanliness** (1-5 stars)
3. **Facilities** (1-5 stars)
4. **Staff Service** (1-5 stars)
5. **Value for Money** (1-5 stars)
6. **Location** (1-5 stars)

#### Review Process:
1. **Eligibility Check**: System validates completed bookings
2. **Multi-Step Form**: Guided review submission with validation
3. **Photo Upload**: Up to 5 high-quality images
4. **Moderation Queue**: Admin review for quality and appropriateness
5. **Public Display**: Approved reviews shown on homepage and booking pages

#### Review Features:
- **Anonymous Option**: Submit reviews without showing name
- **Edit Window**: 24-hour period to modify submitted reviews
- **Response System**: Resort management can respond to reviews
- **Helpful Votes**: Other users can mark reviews as helpful

### Notification System
**Real-time Updates and Alerts**

#### For Guests:
1. **Email Notifications**:
   - Booking confirmations with detailed itinerary
   - Payment confirmations with receipts
   - Check-in reminders (24 hours before arrival)
   - Review requests (after checkout)
   - Promotional offers and seasonal updates

2. **SMS Notifications**:
   - Booking confirmation codes
   - Payment verification alerts
   - Day-of-arrival reminders
   - Emergency notifications
   - Check-out reminders

#### For Admins:
1. **Dashboard Notifications**:
   - New booking alerts with guest details
   - Payment verification requests
   - Review submissions for approval
   - System maintenance alerts
   - User registration notifications

2. **Email Alerts**:
   - Daily operational summaries
   - Weekly revenue reports
   - Monthly analytics dashboards
   - Critical system alerts
   - Guest feedback summaries

### Photo Management System
**Professional Image Handling**

#### Features:
1. **Payment Proof Upload**:
   - Multiple format support (JPG, PNG, PDF)
   - Automatic image compression
   - Secure cloud storage
   - Admin verification workflow

2. **Review Photo System**:
   - High-resolution image support
   - Automatic resizing for web display
   - Inappropriate content detection
   - Gallery integration for approved photos

3. **Gallery Management**:
   - Resort photo showcase
   - User-generated content curation
   - Seasonal photo updates
   - Mobile-optimized viewing

### Legal and Compliance Module
**Complete Policy Management**

#### Available Documents:
1. **Terms of Service**: Complete booking terms and conditions
2. **Privacy Policy**: Data protection and usage policies
3. **Cancellation Policy**: Detailed refund and cancellation rules
4. **House Rules**: Resort guidelines and guest expectations
5. **FAQ Section**: Comprehensive answers to common questions
6. **Help Center**: Step-by-step guides and tutorials

#### Features:
- **Easy Navigation**: Quick access from any page
- **Mobile Optimization**: Responsive design for all devices
- **Search Functionality**: Find specific policy information
- **Version Control**: Track policy updates and changes
- **Acceptance Tracking**: Record user agreement to terms

### Maintenance and System Management
**Proactive System Monitoring**

#### Maintenance Mode Features:
1. **Graceful Degradation**: System remains accessible for existing bookings
2. **Custom Messaging**: Informative alerts about maintenance activities
3. **Scheduled Maintenance**: Automated activation during low-traffic periods
4. **Emergency Mode**: Instant activation for critical system issues
5. **Progress Tracking**: Real-time updates on maintenance completion

#### Configuration Management:
1. **Environment Settings**: Development, staging, and production configurations
2. **Feature Flags**: Enable/disable features without code deployment
3. **API Configuration**: Third-party service integration management
4. **Security Settings**: Authentication and authorization parameters
5. **Performance Monitoring**: System health and optimization alerts

---

## Mobile App Experience

### Progressive Web App (PWA) Features
**Native App-Like Experience on Mobile Devices**

#### Installation:
1. **Android**: Chrome will prompt "Add to Home Screen"
2. **iOS**: Safari → Share → "Add to Home Screen"
3. **Desktop**: Install button in browser address bar

#### Mobile-Optimized Features:
1. **Touch-Friendly Interface**: Large buttons and gesture support
2. **Offline Capability**: View bookings without internet connection
3. **Push Notifications**: Real-time alerts even when app is closed
4. **Fast Loading**: Optimized images and caching
5. **Native Integration**: Camera access for photo uploads

### Mobile-Specific Functionality:
1. **Quick Booking**: Streamlined reservation flow for small screens
2. **Swipe Navigation**: Intuitive gesture controls
3. **Voice Input**: Speech-to-text for search and forms
4. **Location Services**: GPS integration for directions
5. **Contact Integration**: One-tap calling and messaging

---

## System Features

### Security and Privacy
**Enterprise-Grade Protection**

#### Security Measures:
1. **Row-Level Security (RLS)**: Database-level access control
2. **JWT Authentication**: Secure session management
3. **Input Validation**: XSS and SQL injection prevention
4. **HTTPS Encryption**: All data transmission protected
5. **Password Security**: Bcrypt hashing with salt

#### Privacy Protection:
1. **Data Minimization**: Collect only necessary information
2. **Consent Management**: Clear opt-in for communications
3. **Right to Deletion**: Account and data removal options
4. **Data Portability**: Export personal data on request
5. **Breach Notification**: Immediate alerts for security incidents

### Performance Optimization
**Lightning-Fast User Experience**

#### Technical Features:
1. **Server-Side Rendering (SSR)**: Faster initial page loads
2. **Image Optimization**: Automatic compression and lazy loading
3. **Code Splitting**: Load only necessary JavaScript
4. **CDN Integration**: Global content delivery
5. **Caching Strategy**: Intelligent data caching

#### Performance Metrics:
- **Page Load Time**: < 3 seconds on 3G connection
- **Time to Interactive**: < 5 seconds average
- **Lighthouse Score**: 90+ across all categories
- **Core Web Vitals**: Excellent ratings
- **Mobile Performance**: Optimized for all devices

### Analytics and Reporting
**Comprehensive Business Intelligence**

#### Guest Analytics:
1. **Booking Patterns**: Seasonal trends and preferences
2. **User Behavior**: Site interaction and conversion rates
3. **Geographic Data**: Guest origin analysis
4. **Revenue Tracking**: Daily, weekly, monthly summaries
5. **Occupancy Rates**: Capacity utilization metrics

#### Operational Reports:
1. **Daily Checklist**: Arrival/departure management
2. **Financial Summary**: Revenue and payment tracking
3. **Guest Registry**: Complete contact database
4. **Review Analytics**: Satisfaction trends and feedback
5. **System Health**: Performance and uptime monitoring

---

## Troubleshooting

### Common Issues for Guests

#### **Can't Complete Booking**
**Problem**: Payment fails or booking doesn't go through
**Solutions**:
1. Check internet connection
2. Try different payment method (GCash vs Card)
3. Clear browser cache and cookies
4. Try different browser
5. Contact resort directly: +63 945 277 9541

#### **Don't Receive Confirmation Email**
**Problem**: No email after booking or confirmation
**Solutions**:
1. Check spam/junk folder
2. Verify email address in your profile
3. Wait up to 30 minutes for delivery
4. Contact admin if email still missing

#### **Dates Show as Unavailable**
**Problem**: Desired dates appear blocked
**Explanations**:
- Dates may be fully booked (2 bookings maximum per day)
- Resort might be in maintenance mode
- Dates might be in the past
- System might be showing check-out dates as "busy"

#### **Can't Cancel Booking**
**Problem**: Cancel button not working
**Solutions**:
1. Ensure you're logged in
2. Only pending/confirmed bookings can be cancelled
3. Past-due bookings cannot be self-cancelled
4. Contact admin for assistance

#### **Payment Issues**
**Problem**: Payment processing errors
**Solutions**:
1. Verify card details or GCash balance
2. Check with your bank for restrictions
3. Try alternative payment method
4. Contact PayMongo support if persistent

### Common Issues for Admins

#### **Email Notifications Not Sending**
**Problem**: Guests not receiving emails
**Solutions**:
1. Check SMTP configuration in environment variables
2. Verify Gmail app password is correct
3. Check email service status
4. Review error logs in admin panel

#### **Payment Status Not Updating**
**Problem**: Payment appears pending when it's complete
**Solutions**:
1. Check PayMongo dashboard for actual payment status
2. Refresh booking page
3. Manually update booking status if confirmed
4. Contact PayMongo support for webhook issues

#### **Database Connection Issues**
**Problem**: System appears slow or unresponsive
**Solutions**:
1. Check Supabase dashboard for database status
2. Review connection limits
3. Contact technical support
4. Check server status on hosting platform

### Emergency Procedures

#### **System Down During Peak Booking**
1. Immediately switch to manual booking process
2. Contact technical support
3. Inform guests via phone/social media
4. Document all manual bookings for later system entry

#### **Payment System Failure**
1. Accept manual payments (bank transfer, cash)
2. Document all transactions
3. Update system when service restored
4. Notify guests of alternative payment arrangements

#### **Data Backup and Recovery**
1. Regular automated backups through Supabase
2. Export critical data weekly
3. Contact technical support for data recovery
4. Have offline guest contact list as backup

### Contact Information

#### **Technical Support**
- **System Issues**: Contact development team
- **Urgent Problems**: Call resort directly for immediate assistance
- **Email**: kampoibayo@gmail.com
- **Phone**: +63 945 277 9541

#### **Guest Support**
- **Booking Questions**: Call resort directly
- **Cancellations**: Use system or call for assistance
- **Payment Issues**: PayMongo support + resort admin
- **General Inquiries**: Facebook messenger or email

#### **Emergency Contact**
- **Resort Phone**: +63 945 277 9541 (24/7 during operating season)
- **Location**: 132 Ibayo, Brgy Tapia, General Trias, Cavite
- **Nearest Hospital**: General Trias Hospital (20 minutes)

---

## Appendix

### System Specifications
**Technical Details for Reference**

#### Frontend Technology:
- **Framework**: Next.js 15.5.2 with App Router
- **UI Library**: React 19.1.0 with TypeScript
- **Styling**: Tailwind CSS 4.0 with responsive design
- **Icons**: Lucide React and React Icons
- **Charts**: Recharts 3.3.0 for analytics visualization

#### Backend Technology:
- **Database**: Supabase PostgreSQL with Row-Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **API**: Next.js API Routes with TypeScript
- **Email Service**: Nodemailer with Gmail SMTP
- **SMS Service**: Semaphore API integration
- **Payment**: PayMongo API integration

#### External Integrations:
- **Maps**: Google Maps embedded integration
- **Social Media**: Facebook and Instagram links
- **Analytics**: Custom reporting dashboard
- **Cloud Storage**: Supabase Storage for images
- **CDN**: Vercel Edge Network for global delivery

### Version History
**System Evolution Timeline**

#### Version 2.0 (November 2025) - Current
- **New Features**: Manual payment proof upload system
- **Enhanced**: AI chatbot with natural language processing
- **Improved**: Mobile PWA experience with offline capability
- **Added**: Comprehensive review system with photo uploads
- **Updated**: Advanced admin dashboard with real-time analytics

#### Version 1.5 (October 2025)
- **Added**: SMS notification system integration
- **Enhanced**: Email template designs and automation
- **Improved**: Admin reports with export functionality
- **Added**: Legal documentation and compliance features

#### Version 1.0 (September 2025) - Initial Release
- **Core Features**: Basic booking and reservation system
- **Payment**: PayMongo integration for online payments
- **Admin**: Basic dashboard and booking management
- **User**: Account creation and booking management

### Support and Maintenance
**Ongoing System Care**

#### Regular Updates:
- **Security Patches**: Monthly security updates
- **Feature Updates**: Quarterly new feature releases
- **Bug Fixes**: Weekly maintenance and fixes
- **Performance**: Continuous optimization monitoring

#### Support Channels:
1. **Technical Support**: development team for system issues
2. **User Support**: resort staff for booking and guest services
3. **Emergency Support**: 24/7 contact for critical issues
4. **Documentation**: Updated manuals and help guides

---

**Document Information**  
**Manual Version**: 2.0 (Comprehensive Update)  
**Last Updated**: November 1, 2025  
**Valid For**: The Kampo Way Booking System v2.0  
**Next Review**: February 2026  
**Authors**: DAI REN B. DACASIN, JUSTINE CESAR L. OCAMPO, JOHN REIGN REYES  
**Institution**: Cavite State University - Trece Martires City Campus  
**Project**: THE KAMPO WAY: A BOOKING AND RESERVATION SYSTEM FOR KAMPO IBAYO IN GENERAL TRIAS, CAVITE

---

*This manual provides comprehensive guidance for all users of the Kampo Ibayo Booking and Reservation System. For technical questions or system issues, contact the development team. For booking assistance or resort information, contact Kampo Ibayo Resort directly.*

**© 2025 Kampo Ibayo Resort & Development Team. All rights reserved.**