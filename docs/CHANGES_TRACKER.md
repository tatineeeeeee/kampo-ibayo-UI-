# Minor Revisions After Capstone — Kampo Ibayo

Panel/Advisor feedback items and their implementation status.
Audited against actual codebase — March 17, 2026.

---

## UI/UX Improvements (Guest Side)

### 1. Calendar — Landscape Layout
> Pinalandscape ang Check Availability calendar para side-by-side ang calendar at legend.

- **Status:** DONE ✅
- **Commit:** `dedf1a1` — Improve testimonials and availability modal UX
- **Files:** `app/page.tsx` — flex-row layout with calendar (55%) and legend (45%)

---

### 2. Dialog Box — Booking Prompt (Create Account)
> Dialog box na nagpoprompt sa guest: "Para makapag-book, kailangan mong mag-create ng account."

- **Status:** DONE ✅
- **Files:** `app/components/BookingAuthModal.tsx` (new), `app/page.tsx`, `app/components/BookingSelector.tsx`, `app/auth/page.tsx`
- **Note:** Modal intercepts all booking CTAs (hero "Book Your Stay", amenities "Book This Deal" & "Reserve Weekend", BookingSelector empty state). Shows friendly dialog with "Create Account" → `/auth?tab=signup` and "Log In" → `/auth?tab=login`. Auth page updated to read `?tab` param for correct tab pre-selection.

---

### 3. Login Redirect After Email Verification
> Supabase default: pag clinick ang email confirmation link, auto-logged in. Panel ayaw nun — gusto lang ma-redirect sa auth page tapos manually mag-Login.

- **Status:** DONE ✅
- **Files:** `app/auth/confirm/route.ts`, `app/auth/page.tsx`
- **Note:** Added server-side `/auth/confirm` route that verifies OTP via `supabaseAdmin` then redirects to `/auth?tab=login&verified=true` — no auto-login. User sees success toast and must manually log in.

---

### 4. GCash Reference — Auto-clear on Refresh
> Nire-reset ang reference field pag nag-refresh para iwas duplicate/stale data.

- **Status:** DONE ✅
- **Files:** `app/upload-payment-proof/page.tsx`
- **Note:** Added `setReferenceNumber("")` to the image reset block so reference clears when a new image is uploaded. Also added `autoComplete="off"` on reference and amount inputs to prevent browser autofill from retaining stale values.

---

### 5. File Validation — Error Message Position
> Validation message for file upload nilipat sa taas ng analysis section.

- **Status:** DONE ✅
- **Files:** `app/upload-payment-proof/page.tsx`
- **Note:** Moved error display block from below the form fields to immediately after the file upload area (above OCR analysis section). Users now see validation errors (wrong file type, too large) right away instead of buried below.

---

## Color / Design Changes

### 6. Booking Details — Red to Blue
> Pinalitan ang red accent color sa booking pages — consistent blue.

- **Status:** DONE ✅
- **Commit:** `5c782a3` — Replace red accent color with blue across UI
- **Note:** All decorative/accent reds removed. Remaining reds are semantically correct (required field asterisks, error messages, delete/cancel destructive actions, cancelled/failed status badges) — these are standard UX convention, not branding reds.

---

### 7. Color Palette — Site-wide Red Removal
> Lahat ng decorative/accent red colors pinalitan ng blue.

- **Status:** DONE ✅
- **Commits:** `5c782a3`, `34b507e`
- **Note:** Audited all 27 files — every remaining red class is semantically appropriate (errors, warnings, destructive actions, status indicators). No decorative/branding reds remain.

---

## Reviews System

### 8. Review Photos — Optional
> Pag-upload ng photos sa reviews ay ginawang optional.

- **Status:** DONE ✅
- **Commit:** `2e60926` — Add live ratings, testimonials and review carousel
- **Files:** `app/components/ReviewSubmissionForm.tsx` — photos only uploaded if `photos.length > 0`

---

## Form Validation

### 9. Dialog Box — Character Requirements Highlighted
> Naka-highlight ang dialog/message pag hindi pa nami-meet ang character requirement.

- **Status:** DONE ✅
- **Files:** `app/components/ReviewSubmissionForm.tsx`
- **Note:** Textarea border turns red when typing but under 10 chars, green when requirement met. Character counter color changes to match (red/green/gray). Hint below textarea shows exact chars remaining (e.g. "3 more characters required") or "Minimum length met" with a checkmark.

---

## Admin — Payment & Balance

### 10. Admin — Balance Trigger Notification
> System nag-no-notify sa admin pag may guest na may remaining balance.

- **Status:** DONE ✅
- **Files:** `app/components/AdminNotificationBell.tsx`
- **Note:** Added "balance_remaining" notification type. Queries bookings with confirmed/pending status and pending/payment_review payment that have verified payments less than total amount. Shows orange notification: "Guest has ₱X remaining balance". Links to admin bookings page. Orange "Balance" counter in notification footer. Real-time updates via existing postgres_changes subscription.

---

### 11. Balance Visibility — Admin & User
> Pareho nilang makikita kung may remaining balance pa.

- **Status:** DONE ✅
- **Files:** `app/bookings/page.tsx`, `app/admin/bookings/page.tsx`
- **Note:** User side: reschedule modal now shows pricing preview (current amount, new amount, balance due). Upload button shows "Upload Balance" when balance is pending. Admin side: View modal shows prominent "Remaining Balance" card (red) with amount. Shows "Balance due after reschedule" note. Raw `payment_review` status replaced with "Under Review". "Downpayment Progress" renamed to "Payment Progress". "Fully Paid" badge when complete.

---

## Admin — User Management

### 12. Edit Role — Auto Staff Assignment
> Pag nag-add ng bagong user, automatic na naka-set as "Staff".

- **Status:** DONE ✅
- **Files:** `app/admin/users/page.tsx`, `app/api/admin/create-user/route.ts` (new)
- **Note:** Added "Add User" button + modal for admin/super admin. Creates user via `supabaseAdmin.auth.admin.createUser()` with temp password shown once. Default role is "Staff". Only super admin can create admin accounts. Includes AddUserModal, PasswordRevealModal, phone validation, duplicate email detection, and auth rollback on DB failure.

---

## Booking System

### 13. Admin Reports — Date Filter Range
> Panel pointed out: bakit 2025 ang start date ng reports date filter? Need dynamic range — start from earliest booking year hanggang current year + 1 or 2.

- **Status:** DONE ✅
- **Commit:** `a186c18` — Fix admin reports chart accuracy with report-type-aware queries
- **Files:** `app/admin/reports/page.tsx`
- **Note:** Dynamic date range implemented.

---

## Admin Reports

### 14. Footer Overlap Fix — Booking Status Report
> Na-fix ang overlapping footer sa Booking Status Report.

- **Status:** DONE ✅
- **Commit:** `a186c18` — Fix admin reports chart accuracy with report-type-aware queries
- **Files:** `app/admin/reports/page.tsx`

---

### 15. Daily Report — Disable Date Selection
> Na-disable ang date selection sa Daily Report.

- **Status:** DONE ✅
- **Commit:** `a186c18` — Fix admin reports chart accuracy with report-type-aware queries
- **Files:** `app/admin/reports/page.tsx`

---

## Gallery

### 16. Gallery — Carousel
> Nagdagdag ng carousel/slider sa gallery images.

- **Status:** DONE ✅
- **Commit:** `2e60926` — Add live ratings, testimonials and review carousel
- **Files:** `app/components/GalleryCarousel.tsx` (new) — auto-slide, touch handling, arrows

---

### 17. Gallery — Dedicated Category Page
> Separate gallery page organized by category.

- **Status:** DONE ✅
- **Commit:** `831ad97` — Enhance gallery admin with bulk actions & lightbox
- **Files:** `app/gallery/page.tsx` (new), `app/components/Lightbox.tsx` (new)

---

## Guest Capacity

### 18. Guest Accommodation — Confirmed Limit
> Na-set ang exact maximum number of guests.

- **Status:** DONE ✅
- **Files:** `app/book/page.tsx` — default 15 guests, excess fee at >15

---

## Final Panel Feedback

### 19. Add User & Role Designation (Ma'am Bucog)
> Add User function with proper role designation.

- **Status:** DONE ✅
- **Files:** `app/admin/users/page.tsx`, `app/api/admin/create-user/route.ts` (new)
- **Note:** Same implementation as #12. Full Add User feature with role selection, temp password generation, permission matrix (super admin creates admin/staff, admin creates staff only, staff cannot create).

---

## Bugs Found During Audit

### 20. Reschedule — Price Preview Before Confirm
> No pricing breakdown shown in the reschedule modal before the user confirms. User cannot see the new rate, amount already paid, or remaining balance due — only sees it in a toast message AFTER confirming.

- **Status:** DONE ✅
- **Files:** `app/bookings/page.tsx`
- **Note:** Added pricing preview card in reschedule modal. When new dates are selected, shows: current amount, new amount, and balance due (or "No additional payment" if same/cheaper). Uses same pricing logic as API (weekday ₱9k, weekend ₱12k, excess guest fee). Warning note when balance is due.

---

### 21. Reschedule — Upload Proof Blocked After Going Back
> When a confirmed + verified booking is rescheduled to a higher-priced date (e.g., ₱9k weekday → ₱12k weekend), the system redirects to `/upload-payment-proof` for the additional amount. But if the user navigates back from that page, they can no longer access the upload proof page for the rescheduled booking — the option is gone or blocked.

- **Status:** DONE ✅
- **Files:** `app/api/user/reschedule-booking/route.ts`, `app/bookings/page.tsx`
- **Note:** Three fixes: (1) Reschedule API now sets booking `status: "pending"` when price increases (same/cheaper stays confirmed). (2) Upload button component now shows "Upload Balance" when there's a verified proof but booking payment is pending. (3) Upload button renders when `payment_status === "pending"` not just `status === "pending"`. Also added `canRescheduleBooking` guard: only confirmed + verified payment can reschedule.

---

## Session Fixes — March 17, 2026

### 22. Admin Reports — Daily Operations Redesign
> Redesigned Daily Operations Analytics section for clarity and accuracy.

- **Status:** DONE ✅
- **Files:** `app/admin/reports/page.tsx`
- **Note:** Removed redundant bar chart. Replaced with full-width summary: stat cards (Departing → Arriving → Total Guests) + guest detail cards showing name, email, guests, dates, amount. Added special_requests and brings_pet indicators. All metrics now filter for confirmed/completed only (was counting cancelled bookings). Labels changed from Check-ins/Check-outs/Staying to Departing/Arriving/Total Guests to match real-world resort flow (checkout 1:00 PM → checkin 3:00 PM).

---

### 23. Admin Reports — User Report Customer List
> User Report now shows full customer list with contact info, visits, spending.

- **Status:** DONE ✅
- **Files:** `app/admin/reports/page.tsx`
- **Note:** Added Customer List table with: name, email, phone, visit count, category (New/Returning/Frequent/VIP), total spent, last/first visit. Includes ALL registered users (even those with no bookings). Pagination (10/page). Admin/Staff badges. Users sorted first (by spending), staff/admin at bottom. Guest Visit Frequency pie chart fixed to only count confirmed/completed bookings. Date filter bypassed for User Report (shows all-time data).

---

### 24. Admin Reports — Booking Status Report Fixes
> Fixed filters, date defaults, and chart accuracy for Booking Status Report.

- **Status:** DONE ✅
- **Files:** `app/admin/reports/page.tsx`
- **Note:** Added "Completed" status to filter dropdown (was missing). Renamed "All Status" to "Active Bookings" (excludes cancelled by default). Default date range now current month (was today-only). Payment Status pie chart filters confirmed/completed only. Walk-in vs Online section filters confirmed/completed only. All charts respect dropdown filter when specific status selected. Fixed timezone bug in first-of-month date calculation.

---

### 25. Receipt Number Format (Sir Jericho)
> Changed receipt number from timestamp-based to date+booking ID format.

- **Status:** DONE ✅
- **Files:** `app/utils/reactPdfReceiptService.tsx`, `app/utils/receiptService.ts`, `app/api/user/download-receipt/route.ts`, `app/api/user/generate-receipt/route.ts`, `app/api/admin/mark-balance-paid/route.ts`
- **Note:** Old format: `KIR-260317-TTTT081` (random timestamp, changed every download). New format: `20260413-079` (check-in date YYYYMMDD + booking ID, deterministic). Balance reference: `BAL-20260323-078`. Same number on PDF download and email receipt. Updated 4 old database records from ARRIVAL-/BAL- format to new format. Tests updated.

---

### 26. Walk-in Payment Status Fix
> Walk-in bookings now display correctly in admin payments page.

- **Status:** DONE ✅
- **Files:** `app/api/admin/payments/route.ts`, `app/admin/payments/page.tsx`
- **Note:** Walk-ins showed ₱0 and "pending" because they have no payment_proofs records. Fixed API and frontend to detect walk-in bookings (confirmed OR completed) and show "paid (cash)" with correct amount. Added "Walk-in" filter button (amber) to payments page. Removed emojis from reference number displays.

---

## Summary

| # | Item | Status |
|---|------|--------|
| 1 | Calendar Landscape | ✅ DONE |
| 2 | Dialog Box (Create Account) | ✅ DONE |
| 3 | Login Redirect After Verify | ✅ DONE |
| 4 | GCash Reference Auto-clear | ✅ DONE |
| 5 | File Validation Position | ✅ DONE |
| 6 | Booking Details Red → Blue | ✅ DONE |
| 7 | Site-wide Red Removal | ✅ DONE |
| 8 | Review Photos Optional | ✅ DONE |
| 9 | Character Highlight | ✅ DONE |
| 10 | Admin Balance Notification | ✅ DONE |
| 11 | Balance Visibility | ✅ DONE |
| 12 | Auto Staff Role | ✅ DONE |
| 13 | Admin Reports Date Filter Range | ✅ DONE |
| 14 | Footer Overlap Fix | ✅ DONE |
| 15 | Daily Report Date Disable | ✅ DONE |
| 16 | Gallery Carousel | ✅ DONE |
| 17 | Gallery Category Page | ✅ DONE |
| 18 | Guest Limit Confirmed | ✅ DONE |
| 19 | Add User & Roles | ✅ DONE |
| 20 | Reschedule Price Preview Before Confirm | ✅ DONE |
| 21 | Reschedule Upload Proof Blocked After Back | ✅ DONE |
| 22 | Daily Operations Redesign | ✅ DONE |
| 23 | User Report Customer List | ✅ DONE |
| 24 | Booking Status Report Fixes | ✅ DONE |
| 25 | Receipt Number Format | ✅ DONE |
| 26 | Walk-in Payment Status Fix | ✅ DONE |

**DONE: 26/26 | NOT YET DONE: 0/26**
