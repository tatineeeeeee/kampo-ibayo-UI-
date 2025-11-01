# Republic of the Philippines
## CAVITE STATE UNIVERSITY
### Trece Martires City Campus
**(0977)8033809**  
**www.cvsu.edu.ph**

---

# TEST INSTRUMENT

**THE KAMPO WAY: A BOOKING AND RESERVATION SYSTEM FOR KAMPO IBAYO IN GENERAL TRIAS, CAVITE**

**Unit Testing**

**Date:** November 1, 2025  
**Proponents:** DAI REN B. DACASIN  
**&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;** JUSTINE CESAR L. OCAMPO  
**&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;** JOHN REIGN REYES

---

## Module: User Authentication & Account Management Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Enable user registration with email verification | |
| Enable user login with email and password | |
| Enable user logout with session cleanup | |
| Password recovery using email reset link | |
| Edit user profile information (name, email, phone) | |
| Upload and display profile image | |
| Role-based access control (admin/staff/user) | |
| Phone number validation for Philippine numbers | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Access privileges are correct for each role | |
| User session management works properly | |
| Password encryption and validation functions correctly | |
| Phone number formatting and validation accuracy | |

---

## Module: Booking Management Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Create new booking with guest information | |
| Real-time availability checking and calendar display | |
| Dynamic pricing calculation (weekday/weekend rates) | |
| Prevent double-booking and date conflicts | |
| Handle special requests and pet-friendly options | |
| Booking status workflow (pending → confirmed → cancelled) | |
| Calculate total amount including guest count | |
| Generate booking confirmation details | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Availability calculations are correct | |
| Pricing calculations match business rules | |
| Booking conflicts are properly prevented | |
| Date range validation works accurately | |

| **Access Privileges** | **Remarks (Passed/Failed/Comments)** |
|-----------------------|---------------------------------------|
| Users can only view their own bookings | |
| Admins can view and manage all bookings | |
| Guest information is properly secured | |

---

## Module: Payment Management Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Upload payment proof with image validation | |
| Admin verification of payment proofs | |
| Payment status tracking (pending/verified/rejected) | |
| Admin notes and rejection reasons | |
| Payment amount validation | |
| Reference number handling | |
| Payment method selection | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Payment amounts calculated correctly | |
| Payment status updates function properly | |
| File upload validation works correctly | |

| **Access Privileges** | **Remarks (Passed/Failed/Comments)** |
|-----------------------|---------------------------------------|
| Users can only upload proofs for their bookings | |
| Admin-only access to verify payments | |
| Payment data is properly secured | |

---

## Module: Admin Dashboard Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Display real-time booking statistics | |
| Generate monthly revenue charts with authentic data | |
| Show booking status distribution | |
| Calculate average booking values | |
| Auto-refresh dashboard data every 30 seconds | |
| Display total bookings, confirmed, pending, cancelled | |
| Monthly data aggregation by booking dates | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Statistical calculations are accurate | |
| Chart data reflects real database values | |
| Revenue calculations match confirmed bookings | |
| No fake or estimated data is displayed | |

| **Access Privileges** | **Remarks (Passed/Failed/Comments)** |
|-----------------------|---------------------------------------|
| Admin-only access to dashboard | |
| Data filtering and privacy controls work correctly | |

---

## Module: Reports Generation Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Generate daily checklist reports | |
| Create guest registry with contact information | |
| Produce revenue reports for accounting | |
| Generate booking calendar reports | |
| Filter reports by date range and status | |
| Export reports to CSV format | |
| Display filtered booking data in charts | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Report data matches filtered database queries | |
| Export functionality preserves data integrity | |
| Date filtering works correctly | |
| Chart data respects applied filters | |

| **Access Privileges** | **Remarks (Passed/Failed/Comments)** |
|-----------------------|---------------------------------------|
| Admin-only access to generate reports | |
| Filtered data respects privacy settings | |

---

## Module: User Management Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| View all registered users | |
| Edit user roles (admin/staff/user) | |
| Delete user accounts with confirmation | |
| Search and filter users | |
| View user booking history | |
| Track user registration dates | |
| Manage user permissions | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| User data displays correctly | |
| Role changes are applied properly | |
| User deletion removes related data | |

| **Access Privileges** | **Remarks (Passed/Failed/Comments)** |
|-----------------------|---------------------------------------|
| Admin-only access to user management | |
| Proper data protection for user information | |

---

## Module: Review System Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Submit guest reviews with ratings | |
| Upload photos with review submissions | |
| Admin review moderation (approve/reject) | |
| Category ratings (cleanliness, service, location, value, amenities) | |
| Display approved reviews on homepage | |
| Handle review rejection with reasons | |
| Anonymous review options | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Rating calculations are correct | |
| Review data is saved and retrieved properly | |
| Photo uploads function correctly | |

| **Access Privileges** | **Remarks (Passed/Failed/Comments)** |
|-----------------------|---------------------------------------|
| Users can only review their completed bookings | |
| Admin-only moderation capabilities | |
| Public display shows only approved reviews | |

---

## Module: Notification & Communication Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Send booking confirmation emails | |
| Send admin notification emails | |
| SMS reminders for check-ins | |
| Email templates with resort branding | |
| Automated email triggers for booking events | |
| Error handling for failed notifications | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Email content is accurate and formatted correctly | |
| SMS formatting follows proper standards | |
| Notification triggers work at correct times | |

---

## Module: Maintenance Mode Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Enable/disable maintenance mode | |
| Display maintenance message to users | |
| Restrict booking functionality during maintenance | |
| Admin-only access during maintenance | |
| Real-time maintenance status updates | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Maintenance status updates correctly | |
| Booking restrictions are properly enforced | |

| **Access Privileges** | **Remarks (Passed/Failed/Comments)** |
|-----------------------|---------------------------------------|
| Admin-only access to maintenance controls | |
| Staff can view but not modify maintenance settings | |

---

## Module: Availability Calendar Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Display real-time availability calendar | |
| Show check-in, check-out, and occupied dates | |
| Handle same-day turnover (12 PM checkout, 2 PM check-in) | |
| Prevent bookings for past dates | |
| Visual indicators for different booking statuses | |
| Navigate between months and years | |
| Limit bookings to 2-year advance window | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Availability calculations are accurate | |
| Date comparisons work correctly | |
| Booking conflicts are properly detected | |

---

## Module: Settings & Configuration Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Configure resort pricing (weekday/weekend rates) | |
| Manage system settings and preferences | |
| Update contact information | |
| Configure email and SMS settings | |
| Backup and restore system data | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Settings are saved and applied correctly | |
| Configuration changes take effect immediately | |

| **Access Privileges** | **Remarks (Passed/Failed/Comments)** |
|-----------------------|---------------------------------------|
| Admin-only access to system settings | |
| Changes are logged and traceable | |

---

## Module: Data Security & Validation Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Input validation for all forms | |
| SQL injection prevention | |
| XSS attack protection | |
| CSRF token validation | |
| Secure file upload handling | |
| Session management security | |
| API endpoint protection | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Validation rules are enforced correctly | |
| Security measures function as expected | |
| Error messages are appropriate and secure | |

---

## Module: Homepage & Landing Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Display resort hero section with images | |
| Show real-time availability calendar modal | |
| Display pricing information (weekday/weekend) | |
| Show amenities and facilities information | |
| Display photo gallery with resort images | |
| Show guest reviews on homepage | |
| Contact information and Google Maps integration | |
| Responsive navigation menu | |
| Back-to-top functionality | |
| Social media links and footer | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Pricing displays match actual rates | |
| Contact information is accurate | |
| Map location points to correct address | |

---

## Module: Chatbot & AI Support Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Intelligent chatbot with 200+ FAQ responses | |
| Floating chatbot button interface | |
| Contextual responses to booking questions | |
| Resort information and policies assistance | |
| Booking guidance and support | |
| Contact information provision | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Chatbot responses are relevant and accurate | |
| Information provided matches resort policies | |

---

## Module: Photo Management & Gallery Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Enhanced gallery display with resort photos | |
| Photo upload for review submissions | |
| Image optimization and compression | |
| Responsive image galleries | |
| Photo viewing modal with navigation | |
| Profile picture upload and management | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Images load correctly across devices | |
| Photo uploads maintain quality | |
| Gallery navigation functions properly | |

---

## Module: Legal & Policy Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Terms of service and privacy policy display | |
| Cancellation policy information | |
| House rules and resort policies | |
| FAQ section with common questions | |
| Help center and support information | |
| Legal navigation and page routing | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Legal content is up-to-date and accurate | |
| Policy information matches business practices | |

---

## Module: Booking Confirmation & Check-in Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Booking confirmation page display | |
| Check-in details and instructions | |
| Booking summary with all details | |
| Payment status display | |
| Resort contact information for check-in | |
| Booking modification options | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Confirmation details match booking data | |
| Check-in instructions are accurate | |

---

## Module: User Profile & Settings Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Display user profile information | |
| Edit personal details (name, email, phone) | |
| View booking history | |
| Profile picture upload and management | |
| Account settings and preferences | |
| Password change functionality | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Profile updates save correctly | |
| Booking history displays accurate data | |

---

## Module: API Routes & Backend Services Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Admin booking confirmation API | |
| Admin booking cancellation API | |
| User booking cancellation API | |
| Payment proof verification API | |
| Review approval/rejection API | |
| User account deletion API | |
| Email sending service API | |
| SMS notification service API | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| API responses are correct and consistent | |
| Error handling works properly | |
| Authentication checks function correctly | |

---

## Module: Database Integration Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Supabase connection and authentication | |
| Real-time data synchronization | |
| Row-level security (RLS) policies | |
| Database query optimization | |
| Transaction handling for bookings | |
| Data backup and recovery | |
| Foreign key relationships maintenance | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Database queries return accurate results | |
| Data integrity is maintained | |
| Real-time updates function correctly | |

---

## Module: Utilities & Helper Functions Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Phone number formatting and validation | |
| Date and time utilities | |
| Email service configuration | |
| SMS service integration | |
| Booking utilities and calculations | |
| User validation helpers | |
| API timeout handling | |
| Server authentication helpers | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Utility functions produce correct results | |
| Phone number validation works for Philippine numbers | |
| Date calculations are accurate | |

---

## Module: Component Library & UI Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Toast notification system | |
| Booking selector component | |
| Review modal and submission forms | |
| Category ratings component | |
| Enhanced UI components | |
| Cancellation policy display | |
| Logo and branding components | |
| Notification dropdown | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Components render correctly | |
| UI interactions work as expected | |
| Responsive design functions properly | |

---

## Module: Hooks & State Management Module
| **FUNCTIONALITY** | **Remarks (Passed/Failed/Comments)** |
|-------------------|---------------------------------------|
| Admin booking statistics hook | |
| Admin notifications management | |
| Booking statistics tracking | |
| Manual validation hooks | |
| Review modal state management | |
| Role-based access control hooks | |

| **Accuracy** | **Remarks (Passed/Failed/Comments)** |
|--------------|---------------------------------------|
| Hooks return accurate state data | |
| State management works correctly | |
| Component updates trigger properly | |

---

**_____________________________**  
**Name & Signature of Tester**  
**Date: __________________**