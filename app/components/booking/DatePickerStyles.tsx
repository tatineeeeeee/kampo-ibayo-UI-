"use client";

export default function DatePickerStyles() {
  return (
    <style jsx global>{`
      /* =====================================================
         CALENDAR WRAPPER — uses CSS vars, adapts to theme
         ===================================================== */
      .react-datepicker {
        background: hsl(var(--card)) !important;
        border: 1px solid hsl(var(--border)) !important;
        color: hsl(var(--foreground)) !important;
        font-family: inherit !important;
        border-radius: 1rem !important;
        box-shadow: 0 4px 24px rgba(0,0,0,0.12) !important;
      }
      .react-datepicker__month-container {
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
      }
      .react-datepicker__month {
        display: flex !important;
        flex-direction: column !important;
        margin: 0 !important;
        padding-bottom: 0.5rem !important;
      }
      .react-datepicker__week {
        display: flex !important;
        justify-content: space-around !important;
        align-items: center !important;
        height: 4.2rem !important;
        min-height: 4.2rem !important;
      }

      /* =====================================================
         HEADER — primary teal (matches brand, not blue)
         ===================================================== */
      .react-datepicker__header {
        background: hsl(var(--primary)) !important;
        border-bottom: none !important;
        border-radius: 1rem 1rem 0 0 !important;
        padding: 1.25rem 0 !important;
      }
      .react-datepicker__current-month {
        color: white !important;
        font-weight: 700 !important;
        font-size: 1.3rem !important;
        margin-bottom: 1rem !important;
      }
      .react-datepicker__day-name {
        color: rgba(255,255,255,0.85) !important;
        font-weight: 600 !important;
        font-size: 0.85rem !important;
        width: 3.5rem !important;
        height: 2.5rem !important;
        line-height: 2.5rem !important;
        margin: 0.2rem !important;
        display: inline-block !important;
        text-align: center !important;
        letter-spacing: 0.03em !important;
      }
      .react-datepicker__navigation {
        top: 0.85rem !important;
        width: 2rem !important;
        height: 2rem !important;
        background: rgba(255,255,255,0.2) !important;
        border-radius: 50% !important;
        border: none !important;
        transition: background 0.2s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 !important;
      }
      .react-datepicker__navigation:hover {
        background: rgba(255,255,255,0.38) !important;
      }
      .react-datepicker__navigation--previous {
        left: 0.85rem !important;
      }
      .react-datepicker__navigation--next {
        right: 0.85rem !important;
      }
      .react-datepicker__navigation-icon {
        position: absolute !important;
        inset: 0 !important;
        top: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        height: 100% !important;
      }
      .react-datepicker__navigation-icon::before {
        position: relative !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        margin: 0 !important;
        border-color: white !important;
        border-style: solid !important;
        border-width: 2.5px 2.5px 0 0 !important;
        width: 8px !important;
        height: 8px !important;
        display: block !important;
        content: "" !important;
      }
      .react-datepicker__navigation-icon--previous::before {
        transform: rotate(225deg) !important;
      }
      .react-datepicker__navigation-icon--next::before {
        transform: rotate(45deg) !important;
      }

      /* =====================================================
         AVAILABLE DAYS — primary teal gradient
         ===================================================== */
      .react-datepicker__day {
        color: hsl(var(--primary-foreground)) !important;
        border-radius: 0.5rem !important;
        margin: 0.2rem !important;
        border: none !important;
        width: 3.5rem !important;
        height: 3.5rem !important;
        line-height: 3.2rem !important;
        font-size: 1.05rem !important;
        transition: all 0.2s ease !important;
        display: inline-block !important;
        text-align: center !important;
        background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%) !important;
        position: relative !important;
      }
      .react-datepicker__day:hover {
        filter: brightness(1.12) !important;
        transform: scale(1.05) !important;
        box-shadow: 0 4px 6px -1px hsl(var(--primary) / 0.35) !important;
      }
      /* Available dates — no badge, color speaks for itself */
      .react-datepicker__day::after {
        display: none !important;
      }

      /* =====================================================
         SELECTED / RANGE — orange (your pick), keep as-is
         ===================================================== */
      .react-datepicker__day--selected,
      .react-datepicker__day--range-start,
      .react-datepicker__day--range-end {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
        color: white !important;
        font-weight: 700 !important;
        box-shadow: 0 4px 6px -1px rgba(249,115,22,0.5) !important;
      }
      .react-datepicker__day--in-range {
        background: rgba(249,115,22,0.25) !important;
        color: hsl(var(--foreground)) !important;
      }
      .react-datepicker__day--selected::after,
      .react-datepicker__day--range-start::after,
      .react-datepicker__day--range-end::after {
        content: "PICK" !important;
        display: block !important;
        background: rgba(0,0,0,0.45) !important;
        color: white !important;
      }
      .react-datepicker__day--selected:hover,
      .react-datepicker__day--range-start:hover,
      .react-datepicker__day--range-end:hover {
        background: linear-gradient(135deg, #fb923c 0%, #f97316 100%) !important;
        transform: scale(1.05) !important;
      }

      /* =====================================================
         TODAY — matches available style (teal), slight ring
         ===================================================== */
      .react-datepicker__day--today {
        background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%) !important;
        color: hsl(var(--primary-foreground)) !important;
        font-weight: 700 !important;
        box-shadow: 0 0 0 2px hsl(var(--primary-foreground) / 0.4) inset !important;
      }

      /* =====================================================
         DISABLED / EXCLUDED — themed muted
         ===================================================== */
      .react-datepicker__day--disabled,
      .react-datepicker__day--excluded {
        background: hsl(var(--muted)) !important;
        color: hsl(var(--muted-foreground)) !important;
        opacity: 0.6 !important;
      }
      .react-datepicker__day--disabled:hover,
      .react-datepicker__day--excluded:hover {
        background: hsl(var(--muted)) !important;
        cursor: not-allowed !important;
        transform: none !important;
        filter: none !important;
        box-shadow: none !important;
      }
      .react-datepicker__day--disabled::after,
      .react-datepicker__day--excluded::after {
        content: "N/A" !important;
        display: block !important;
        background: rgba(0,0,0,0.3) !important;
        color: hsl(var(--muted-foreground)) !important;
      }

      /* =====================================================
         OUTSIDE MONTH DAYS
         ===================================================== */
      .react-datepicker__day--outside-month {
        opacity: 0.35 !important;
      }
      .react-datepicker__day--outside-month:hover {
        opacity: 0.55 !important;
        transform: scale(1.05) !important;
      }

      /* =====================================================
         STATUS LEGEND COLORS — ORIGINAL, DO NOT CHANGE
         ===================================================== */

      /* Check-in: blue */
      .react-datepicker__day--checkin {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
        color: white !important;
        font-weight: 600 !important;
        position: relative !important;
      }
      .react-datepicker__day--checkin:hover {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
        transform: scale(1.05) !important;
      }
      .react-datepicker__day--checkin::after {
        content: "CHECK IN" !important;
        display: block !important;
        background: rgba(0,0,0,0.5) !important;
        color: white !important;
      }

      /* Check-out: red/pink */
      .react-datepicker__day--checkout {
        background: linear-gradient(135deg, #fb7185 0%, #f43f5e 100%) !important;
        color: white !important;
        font-weight: 600 !important;
        position: relative !important;
      }
      .react-datepicker__day--checkout:hover {
        background: linear-gradient(135deg, #fda4af 0%, #fb7185 100%) !important;
        transform: scale(1.05) !important;
      }
      .react-datepicker__day--checkout::after {
        content: "CHECK OUT" !important;
        display: block !important;
        background: rgba(0,0,0,0.5) !important;
        color: white !important;
      }

      /* Occupied: yellow */
      .react-datepicker__day--occupied {
        background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%) !important;
        color: white !important;
        font-weight: 600 !important;
        position: relative !important;
      }
      .react-datepicker__day--occupied:hover {
        background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%) !important;
        transform: scale(1.05) !important;
      }
      .react-datepicker__day--occupied::after {
        content: "OCCUPIED" !important;
        display: block !important;
        background: rgba(0,0,0,0.5) !important;
        color: white !important;
      }

      /* Same-day / Full: purple */
      .react-datepicker__day--same-day {
        background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%) !important;
        color: white !important;
        font-weight: 600 !important;
        position: relative !important;
      }
      .react-datepicker__day--same-day:hover {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
        transform: scale(1.05) !important;
      }
      .react-datepicker__day--same-day::after {
        content: "FULL" !important;
        display: block !important;
        background: rgba(0,0,0,0.5) !important;
        color: white !important;
      }

      /* Shared ::after positioning for all status badges */
      .react-datepicker__day--selected::after,
      .react-datepicker__day--range-start::after,
      .react-datepicker__day--range-end::after,
      .react-datepicker__day--disabled::after,
      .react-datepicker__day--excluded::after,
      .react-datepicker__day--checkin::after,
      .react-datepicker__day--checkout::after,
      .react-datepicker__day--occupied::after,
      .react-datepicker__day--same-day::after {
        position: absolute !important;
        bottom: 2px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        font-size: 8px !important;
        padding: 1px 3px !important;
        border-radius: 2px !important;
        line-height: 1 !important;
        font-weight: 700 !important;
        white-space: nowrap !important;
        letter-spacing: 0.02em !important;
      }

      /* =====================================================
         INLINE CALENDAR (transparent wrapper)
         ===================================================== */
      .inline-calendar {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        width: 100% !important;
      }
      .inline-calendar .react-datepicker__month-container {
        background: transparent !important;
        width: 100% !important;
      }
      .react-datepicker--inline {
        background: transparent !important;
        border: none !important;
        width: 100% !important;
      }
      .react-datepicker--inline .react-datepicker__month {
        margin: 0 !important;
      }
      .react-datepicker__day-names {
        display: flex !important;
        justify-content: space-around !important;
        height: 40px !important;
        min-height: 40px !important;
        align-items: center !important;
      }
      .react-datepicker__week {
        display: flex !important;
        justify-content: space-around !important;
      }

      /* =====================================================
         CONSISTENT 6-ROW HEIGHT — no fixed px, rows drive height
         ===================================================== */
      .react-datepicker__month {
        justify-content: flex-start !important;
      }
      .react-datepicker__week {
        height: 4.2rem !important;
        min-height: 4.2rem !important;
        flex: none !important;
      }
      .react-datepicker__header {
        padding: 1rem 0 0.5rem !important;
      }

      /* =====================================================
         MOBILE OVERRIDES
         ===================================================== */
      @media (max-width: 768px) {
        .react-datepicker__day {
          width: 2.8rem !important;
          height: 2.8rem !important;
          line-height: 2.8rem !important;
          margin: 0.15rem !important;
          font-size: 0.9rem !important;
        }
        .react-datepicker__day-name {
          width: 2.8rem !important;
          height: 2.2rem !important;
          line-height: 2.2rem !important;
          font-size: 0.8rem !important;
        }
        .react-datepicker__week {
          height: 3.5rem !important;
          min-height: 3.5rem !important;
        }
        .react-datepicker__day--selected::after,
        .react-datepicker__day--checkin::after,
        .react-datepicker__day--checkout::after,
        .react-datepicker__day--occupied::after,
        .react-datepicker__day--same-day::after,
        .react-datepicker__day--disabled::after,
        .react-datepicker__day--excluded::after {
          font-size: 7px !important;
          bottom: 1px !important;
        }
      }
      @media (max-width: 480px) {
        .react-datepicker__day {
          width: 2.5rem !important;
          height: 2.5rem !important;
          line-height: 2.5rem !important;
          margin: 0.1rem !important;
          font-size: 0.85rem !important;
        }
        .react-datepicker__day-name {
          width: 2.5rem !important;
          height: 2rem !important;
          line-height: 2rem !important;
          font-size: 0.75rem !important;
        }
      }

      /* =====================================================
         AUTOFILL — prevent white flash in dark mode
         ===================================================== */
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px hsl(var(--card)) inset !important;
        -webkit-text-fill-color: hsl(var(--foreground)) !important;
        transition: background-color 5000s ease-in-out 0s !important;
      }
    `}</style>
  );
}
