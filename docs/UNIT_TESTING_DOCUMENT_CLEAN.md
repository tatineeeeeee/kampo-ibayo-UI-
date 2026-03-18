Republic of the Philippines  
CAVITE STATE UNIVERSITY  
Trece Martires City Campus  
🕾 (0977)8033809  
www.cvsu.edu.ph

**TEST INSTRUMENT**

**The Kampo Way: A Booking and Reservation System for Kampo Ibayo in General Trias, Cavite**

---

### Unit testing

**Date:** **\_\_\_\_**  
**Proponents:**  
Dacasin, Dai Ren B.  
Ocampo, Justine Cesar L.  
Reyes, John Reign

---

#### Module: User Authentication & Account Management

**Remarks (Passed/Failed/Comments)**

**FUNCTIONALITY**  
User can sign up with email and password  
User can log in with correct credentials  
User can log out successfully  
User can reset password via email  
User can edit profile information (name, email, phone)

**ACCURACY**  
Correct user role is applied (user, staff, or admin)  
Profile updates are saved and displayed correctly  
Session remains active until logout

---

#### Module: Online Booking & Reservation (with Real-Time Availability)

**Remarks (Passed/Failed/Comments)**

**FUNCTIONALITY**  
User can create new booking with dates, guest count, and contact information  
System shows real-time availability calendar  
System prevents double-booking (blocks unavailable dates)  
User can select pet-friendly option when booking  
User can add special requests  
System calculates total amount based on dates and number of guests  
User can view their booking history (pending, confirmed, completed, cancelled)  
User can cancel booking if needed  
Staff/Admin can confirm or cancel any booking

**ACCURACY**  
Calendar shows correct available and booked dates  
Pricing is calculated correctly (weekday vs weekend rates, extra guests)  
Booking details are saved accurately in the system  
Users can only see their own bookings  
Staff/Admins can see all bookings

**ACCESS PRIVILEGES**  
Users can only manage their own bookings  
Staff and admins can manage all bookings

---

#### Module: Secure Payment Integration

**Remarks (Passed/Failed/Comments)**

**FUNCTIONALITY**  
User can upload payment proof (screenshot or photo)  
System supports payment methods: GCash, Maya, Bank Transfer  
Staff/Admin can verify payment proofs (approve or reject)  
System tracks payment status (pending, verified, rejected)  
User receives notification when payment is verified or rejected

**ACCURACY**  
Payment amounts match the booking total  
Payment status updates correctly after staff/admin verification  
Uploaded files are stored securely

**ACCESS PRIVILEGES**  
Users can only upload payment for their own bookings  
Only staff and admins can verify or reject payments

---

#### Module: Admin Interface & Reports

**Remarks (Passed/Failed/Comments)**

**FUNCTIONALITY**  
Staff/Admin can view dashboard with booking statistics  
Staff/Admin can view all bookings with filters (date, status)  
Staff/Admin can manage reservations (confirm, cancel)  
Staff/Admin can verify payment proofs  
Staff/Admin can view customer inquiries and information  
System generates automated reports (daily operations, bookings, revenue)  
Staff/Admin can export reports to CSV format

**ACCURACY**  
Dashboard statistics match actual booking counts  
Filters show correct bookings  
Reports contain accurate data

**ACCESS PRIVILEGES**  
Only staff and admins can access dashboard and management features

---

#### Module: Guest Reviews & Ratings

**Remarks (Passed/Failed/Comments)**

**FUNCTIONALITY**  
Guests can leave reviews after their stay  
Guests can rate their experience (1-5 stars)  
Guests can upload photos with reviews (optional)  
Staff/Admin can approve or reject reviews  
Only approved reviews are shown publicly

**ACCURACY**  
Reviews are saved correctly  
Ratings display accurately  
Only completed bookings can be reviewed

**ACCESS PRIVILEGES**  
Users can only review their own completed bookings  
Only staff and admins can approve/reject reviews

---

#### Module: Automated SMS & Email Notifications

**Remarks (Passed/Failed/Comments)**

**FUNCTIONALITY**  
System sends booking confirmation via email and SMS  
System sends payment verification notification  
System sends booking reminder before check-in date  
System sends cancellation notification  
Staff/Admin receives notification for new bookings

**ACCURACY**  
Notifications contain correct guest name, dates, and booking details  
Notifications are sent at the right time (booking, payment, reminder)

---

#### Module: Chatbot / Customer Support

**Remarks (Passed/Failed/Comments)**

**FUNCTIONALITY**  
Chatbot is available on the page  
Chatbot can answer common questions  
Chatbot provides helpful information about the resort

**ACCURACY**  
Chatbot responses are relevant and helpful  
Chatbot is accessible on all pages

---

Republic of the Philippines  
CAVITE STATE UNIVERSITY

---

Name & Signature of Tester  
Date: **\_\_\_\_**

---

### Integration testing

**TEST INSTRUMENT**

**The Kampo Way: A Booking and Reservation System for Kampo Ibayo in General Trias, Cavite**

**Date:** **\_\_\_\_**  
**Proponents:**  
Dacasin, Dai Ren B.  
Ocampo, Justine Cesar L.  
Reyes, John Reign

| Modules                          | Functionality                                                                                                | Passed/Failed | Remarks |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------- | ------- |
| User Authentication Module       | Enable user sign-up, login, logout, and role-based access across guest, staff, and admin interfaces          |               |         |
| Online Booking Module            | Create bookings with real-time availability, pet-friendly options, prevent double-booking, calculate pricing |               |         |
| Payment Integration Module       | Upload payment proof (GCash, Maya, Bank), staff/admin verify payments, track payment status                  |               |         |
| Admin Dashboard & Reports Module | Display booking statistics, manage reservations, generate automated reports, export to CSV                   |               |         |
| Review & Rating Module           | Submit reviews after stay, rate experience, upload photos, staff/admin approve/reject reviews                |               |         |
| SMS & Email Notification Module  | Send booking confirmations, payment notifications, check-in reminders, cancellation alerts automatically     |               |         |
| Chatbot Support Module           | Provide automated customer support, answer FAQs, guide users through booking process                         |               |         |
| Profile & Booking History Module | View/edit profile, display booking history, link user accounts correctly across system                       |               |         |

---

Name & Signature of Tester  
Date: **\_\_\_\_**

---

### System testing

**TEST INSTRUMENT**

**The Kampo Way: A Booking and Reservation System for Kampo Ibayo in General Trias, Cavite**

**Date:** **\_\_\_\_**  
**Proponents:**  
Dacasin, Dai Ren B.  
Ocampo, Justine Cesar L.  
Reyes, John Reign

| Action                           | Activities                                                                          | System Response                                                 | Expected Error                            | System Response Error                |
| -------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------- | ------------------------------------ |
| User Authentication              | Login and Logout - enter email/password, authenticate, redirect, logout             | Correct login, secure session, successful logout                | Wrong credentials                         | Show error, do not log in            |
| User Registration                | Sign up new account - enter details, create account with role                       | Account is created and can be used to log in                    | Duplicate email                           | Show "email already in use"          |
| Booking Creation                 | Create new booking - select dates, guests, pet option, contact info                 | Booking created as pending, visible in "My Bookings"            | Past date or conflicting dates            | Show validation error, no booking    |
| Real-Time Availability           | Check availability calendar - view dates, see booked/available status               | Calendar shows correct available and blocked dates              | Selecting unavailable date                | Date not selectable, shows booked    |
| Payment Proof Upload             | Upload payment proof - select image, choose payment method (GCash/Maya/Bank)        | File validated, payment status set to under review              | Invalid file or too large                 | Show upload validation error         |
| Staff/Admin Payment Verification | Staff/Admin verifies payment - open booking, view proof, approve/reject             | Booking/payment status updated to verified/rejected accordingly | Invalid or missing proof                  | Show appropriate error/notice        |
| Booking Cancellation             | Cancel existing booking - user or staff/admin triggers cancel with reason           | Status changes to cancelled, notification sent                  | Cancellation of already confirmed booking | Show cancellation policy message     |
| Review Submission                | Submit review after completed stay - select booking, rate, write review, add photos | Review saved, sent for staff/admin approval                     | Review without required rating            | Show validation error                |
| Staff/Admin Review Moderation    | Staff/Admin moderate reviews - view pending, approve or reject                      | Approved reviews appear publicly, rejected are hidden           | Approving inappropriate content           | Staff/admin must manually review     |
| Email Notifications              | Booking events - create booking, confirm, cancel, verify payment                    | Correct emails sent with booking details                        | Email server problem                      | Log error, show non-blocking message |
| SMS Notifications                | Booking alerts - confirmation, reminder, payment update, cancellation               | SMS sent with correct details to guest phone                    | Invalid phone number                      | Show phone validation error          |
| Admin Dashboard                  | View dashboard - display statistics, bookings, payments                             | Dashboard shows accurate counts and charts                      | No data available                         | Show "No bookings yet" message       |
| Generate Reports                 | Create reports - select date range, export bookings/payments to CSV                 | Report generated with correct data, file downloaded             | Invalid date range                        | Show date validation error           |
| Chatbot Support                  | Ask chatbot questions - type query, receive automated response                      | Chatbot provides relevant answers and guidance                  | Unrecognized question                     | Chatbot suggests alternatives        |
| Profile Update                   | Update profile - change name, email, phone, save changes                            | Profile saved, confirmation shown                               | Invalid email/phone format                | Show validation error                |
| Maintenance Mode                 | Admin activates maintenance - toggle setting                                        | Booking disabled for users, maintenance message shown           | Non-admin/non-staff tries to change       | Access denied                        |
| Responsive Design                | Test on desktop, tablet, mobile                                                     | Layout usable and functional on all devices                     | Very small screen                         | Layout adapts without breaking flows |

---

Name & Signature of Tester  
Date: **\_\_\_\_**
