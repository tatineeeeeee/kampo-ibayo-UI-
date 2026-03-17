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

- **Status:** NOT YET DONE ❌
- **Files:** `app/components/AdminNotificationBell.tsx`
- **Note:** Notification types include cancellation, flagged_review, pending_booking, payment_proof — but NO balance-related notification.

---

### 11. Balance Visibility — Admin & User
> Pareho nilang makikita kung may remaining balance pa.

- **Status:** NOT YET DONE ❌
- **Files:** `app/bookings/page.tsx` (reschedule modal), `app/admin/bookings/page.tsx`
- **Note:** Static balance display exists on both sides (booking card shows "Remaining Balance" for half-payment, admin shows remaining balance card). BUT the reschedule flow is broken for this scenario: user with 50% down payment rescheduling to a higher-rate day (e.g. ₱9k weekday → ₱12k weekend) sees NO pricing preview before confirming — they only find out via toast AFTER the fact. Need to add a pricing breakdown inside the reschedule modal when new dates are selected: show new rate, amount already paid, and additional balance due.

---

## Admin — User Management

### 12. Edit Role — Auto Staff Assignment
> Pag nag-add ng bagong user, automatic na naka-set as "Staff".

- **Status:** NOT YET DONE ❌
- **Files:** `app/admin/users/page.tsx`
- **Note:** No "add user" functionality found — only role filtering for viewing staff users.

---

## Booking System

### 13. Admin Reports — Date Filter Range
> Panel pointed out: bakit 2025 ang start date ng reports date filter? Need dynamic range — start from earliest booking year hanggang current year + 1 or 2.

- **Status:** NOT YET DONE ❌
- **Files:** `app/admin/reports/page.tsx`
- **Note:** Currently starts at 2025 (today). Should be dynamic: earliest booking year (2025) to current year + 1 (2027). Range grows automatically over time.

---

## Admin Reports

### 14. Footer Overlap Fix — Booking Status Report
> Na-fix ang overlapping footer sa Booking Status Report.

- **Status:** NOT YET DONE ❌
- **Files:** `app/admin/reports/page.tsx`
- **Note:** No evidence of specific footer positioning fixes found.

---

### 15. Daily Report — Disable Date Selection
> Na-disable ang date selection sa Daily Report.

- **Status:** NOT YET DONE ❌
- **Files:** `app/admin/reports/page.tsx`
- **Note:** No evidence of date picker being disabled for daily report type.

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

- **Status:** NOT YET DONE ❌
- **Files:** `app/admin/users/page.tsx`
- **Note:** Only user deletion and viewing found. No "add user" dialog with role selection.

---

## Bugs Found During Audit

### 20. Reschedule — Price Preview Before Confirm
> No pricing breakdown shown in the reschedule modal before the user confirms. User cannot see the new rate, amount already paid, or remaining balance due — only sees it in a toast message AFTER confirming.

- **Status:** NOT YET DONE ❌
- **Files:** `app/bookings/page.tsx` (reschedule modal, around line 2580–2680)
- **Note:** API already returns `result.pricing.newAmount` — data exists, just not shown in UI before confirm. Need to add a pricing summary card inside the reschedule modal when new dates are selected: (1) New rate, (2) Amount already paid, (3) Additional balance due. Only relevant when new date has a different price (weekday ↔ weekend).

---

### 21. Reschedule — Upload Proof Blocked After Going Back
> When a confirmed + verified booking is rescheduled to a higher-priced date (e.g., ₱9k weekday → ₱12k weekend), the system redirects to `/upload-payment-proof` for the additional amount. But if the user navigates back from that page, they can no longer access the upload proof page for the rescheduled booking — the option is gone or blocked.

- **Status:** NOT YET DONE ❌
- **Files:** `app/upload-payment-proof/page.tsx`, `app/bookings/page.tsx`
- **Note:** Likely cause — after reschedule, the booking's `payment_status` may still read as `verified` from the original payment, so the system thinks no payment is needed and hides the upload option. Same-price reschedules work fine (no additional payment required, no issue). Fix must: detect that a reschedule happened with a price increase and keep the upload-proof option accessible until the additional payment is verified.

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
| 10 | Admin Balance Notification | ❌ NOT YET |
| 11 | Balance Visibility | ❌ NOT YET |
| 12 | Auto Staff Role | ❌ NOT YET |
| 13 | Admin Reports Date Filter Range | ❌ NOT YET |
| 14 | Footer Overlap Fix | ❌ NOT YET |
| 15 | Daily Report Date Disable | ❌ NOT YET |
| 16 | Gallery Carousel | ✅ DONE |
| 17 | Gallery Category Page | ✅ DONE |
| 18 | Guest Limit Confirmed | ✅ DONE |
| 19 | Add User & Roles | ❌ NOT YET |
| 20 | Reschedule Price Preview Before Confirm | ❌ NOT YET |
| 21 | Reschedule Upload Proof Blocked After Back | ❌ NOT YET |

**DONE: 12/21 | PARTIALLY DONE: 0/21 | NOT YET DONE: 9/21**
