# Refactoring Plan

## Phase 1 — Hook + Shell Extraction (Customer Pages)

### 1.1 `app/bookings/page.tsx` (3,357 lines)
- Extract `app/hooks/useMyBookings.ts`
- Move all state (~30 useState), 7 useEffects, all handlers (cancel, reschedule, payment upload, refresh)
- Keep 6 inline sub-components (SearchParamsHandler, PaymentProofUploadButton, PaymentBreakdownAmount, PaymentBreakdownDetail, PaymentAmountInfo, UserPaymentProofStatus)
- Page becomes JSX-only shell calling `useMyBookings()`

### 1.2 `app/upload-payment-proof/page.tsx` (1,593 lines)
- Extract `app/hooks/usePaymentProofUpload.ts`
- Move file upload state, OCR processing, booking details, payment history, form state, image preview
- Move all handlers (file selection, OCR trigger, form submission, image manipulation)
- Page becomes JSX-only shell

### 1.3 `app/book/page.tsx` (1,035 lines)
- Extract `app/hooks/useBookingForm.ts`
- Move form state, step/validation, dates/guests/payment type, availability, price calculation
- Move all handlers (submit, date selection, guest changes, availability check)
- Page becomes JSX-only shell

### 1.4 `app/settings/page.tsx` (892 lines)
- Extract `app/hooks/useAccountSettings.ts`
- Move profile data, password fields, loading states, export/delete state
- Move handlers (update profile, change password, export data, delete account, sign out)
- Page becomes JSX-only shell

### 1.5 `app/profile/page.tsx` (608 lines)
- Extract `app/hooks/useProfile.ts`
- Move user data, booking stats, loading, logout handlers, effects
- Page becomes JSX-only shell

---

## Phase 2 — Sub-Component Extraction (Large Components)

### 2.1 `app/components/ReviewSystem.tsx` (902 lines)
- Extract `app/components/ReviewCard.tsx` — individual review card (stars, text, photos, date, guest info)
- Extract `app/components/ReviewDetailModal.tsx` — full review detail modal
- Keep `ReviewSystem.tsx` as wrapper with state, data fetching, carousel/grid layout

### 2.2 `app/components/chatbot/Chatbot.tsx` (1,303 lines)
- Extract `app/components/chatbot/ChatMessage.tsx` — message bubble (bot vs user styling)
- Extract `app/components/chatbot/ChatInput.tsx` — input bar, send button, character count
- Extract `app/hooks/useChatbot.ts` — all state, message processing, FAQ matching, language detection
- Keep `Chatbot.tsx` as UI shell importing hook + sub-components

### 2.3 `app/components/AvailabilityCalendar.tsx` (763 lines)
- Extract `app/components/CalendarGrid.tsx` — calendar day cells grid
- Extract `app/components/CalendarLegend.tsx` — legend/color key
- Keep `AvailabilityCalendar.tsx` as wrapper with state and data fetching

---

## Phase 3 — Verification

- Run `npx tsc --noEmit` after all changes
- Run `npm run build` to confirm production build passes
- Spot-check that no imports are broken across the codebase
