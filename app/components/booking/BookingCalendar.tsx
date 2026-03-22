"use client";

import {
  FaCalendarAlt,
  FaCheck,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { BookingBasic } from "../../lib/types/booking";

interface BookingCalendarProps {
  formData: {
    checkIn: Date | null;
    checkOut: Date | null;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    phone: string;
    guests: string;
    checkIn: Date | null;
    checkOut: Date | null;
    pet: boolean;
    request: string;
  }>>;
  minDate: Date;
  maxBookingDate: Date;
  existingBookings: BookingBasic[];
  pricingBreakdown: {
    totalNights: number;
    totalAmount: number;
  } | null;
}

export default function BookingCalendar({
  formData,
  setFormData,
  minDate,
  maxBookingDate,
  existingBookings,
  pricingBreakdown,
}: BookingCalendarProps) {
  // Calculate capacity for visual indicators
  const getDateCapacity = (date: Date) => {
    // Don't show capacity indicators for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return 0; // Past dates should appear normal
    }

    const activeBookings = existingBookings.filter(
      (booking) =>
        booking.status === "confirmed" || booking.status === "pending",
    );

    // Normalize date for comparison (remove time component)
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let isCheckIn = false;
    let isCheckOut = false;
    let isOccupied = false;

    activeBookings.forEach((booking) => {
      const checkIn = new Date(booking.check_in_date);
      checkIn.setHours(0, 0, 0, 0);

      const checkOut = new Date(booking.check_out_date);
      checkOut.setHours(0, 0, 0, 0);

      // Check if this date is a check-in date
      if (targetDate.getTime() === checkIn.getTime()) {
        isCheckIn = true;
      }

      // Check if this date is a check-out date
      if (targetDate.getTime() === checkOut.getTime()) {
        isCheckOut = true;
      }

      // Check if this date is between check-in and check-out (occupied)
      if (targetDate > checkIn && targetDate < checkOut) {
        isOccupied = true;
      }
    });

    // Determine the appropriate indicator
    if (isCheckIn && isCheckOut) {
      return "same-day"; // Same day check-in and check-out (1-day stay)
    } else if (isCheckIn) {
      return "checkin";
    } else if (isCheckOut) {
      return "checkout";
    } else if (isOccupied) {
      return "occupied";
    }

    return "";
  };

  // Calculate unavailable dates for the date picker - ONLY block real conflicts
  const getUnavailableDates = () => {
    const toYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${da}`;
    };

    // Filter confirmed and pending bookings
    const activeBookings = existingBookings.filter(
      (booking) =>
        booking.status === "confirmed" || booking.status === "pending",
    );

    const unavailableDates: Date[] = [];

    // Count check-ins per date (max 2 check-ins allowed per day)
    const checkInCounts = new Map<string, number>();

    activeBookings.forEach((booking) => {
      const checkIn = new Date(booking.check_in_date);
      const checkInDate = toYMD(checkIn);

      const prevCount = checkInCounts.get(checkInDate) || 0;
      checkInCounts.set(checkInDate, prevCount + 1);
    });

    // Only block dates that have reached check-in capacity (2/2)
    for (const [dateStr, count] of checkInCounts) {
      if (count >= 2) {
        unavailableDates.push(new Date(dateStr));
      }
    }

    // Don't block any other dates - let the conflict checker handle it
    // This allows checkout dates to be selectable for new checkins

    return unavailableDates;
  };

  return (
    <div>
      <div className="rounded-xl border border-border p-2">
        <DatePicker
          selected={formData.checkIn}
          onChange={(dates) => {
            if (Array.isArray(dates)) {
              const [start, end] = dates;

              // Allow cross-month date selection
              // Simply update the dates without month restrictions
              setFormData((prev) => ({
                ...prev,
                checkIn: start,
                checkOut: end,
              }));
            }
          }}
          startDate={formData.checkIn}
          endDate={formData.checkOut}
          selectsRange
          minDate={minDate}
          maxDate={maxBookingDate}
          excludeDates={getUnavailableDates()}
          // Force 6 weeks to be shown for consistent layout
          fixedHeight
          showWeekNumbers={false}
          dayClassName={(date) => {
            // Check if this date is selected (check-in or check-out)
            const isSelected =
              (formData.checkIn &&
                date.toDateString() ===
                  formData.checkIn.toDateString()) ||
              (formData.checkOut &&
                date.toDateString() ===
                  formData.checkOut.toDateString());

            // Selected dates override booking status
            if (isSelected) {
              return "react-datepicker__day--selected";
            }

            // Show booking status for all visible dates (including adjacent month dates)
            const capacity = getDateCapacity(date);
            if (capacity === "same-day")
              return "react-datepicker__day--same-day";
            if (capacity === "checkin")
              return "react-datepicker__day--checkin";
            if (capacity === "checkout")
              return "react-datepicker__day--checkout";
            if (capacity === "occupied")
              return "react-datepicker__day--occupied";
            return "";
          }}
          inline
          monthsShown={1}
          calendarClassName="inline-calendar"
          formatWeekDay={(nameOfDay) => nameOfDay.slice(0, 3)}
        />
      </div>

      {/* Multi-day booking instructions - Only show when no dates selected */}
      {!formData.checkIn && (
        <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <FaInfoCircle className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">Select Your Dates</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Click a date to set <strong>check-in</strong>, then click another for <strong>check-out</strong>.
          </p>
        </div>
      )}

      {/* Show summary when dates are selected */}
      {formData.checkIn && formData.checkOut && (
        <>
          {pricingBreakdown && pricingBreakdown.totalNights > 0 ? (
            <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaCheck className="w-4 h-4 text-success" />
                  <span className="text-success text-sm font-medium">
                    {pricingBreakdown.totalNights}{" "}
                    {pricingBreakdown.totalNights === 1 ? "Night" : "Nights"} Selected
                  </span>
                </div>
                <span className="text-success text-sm font-bold">
                  ₱{pricingBreakdown.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          ) : formData.checkIn.toDateString() === formData.checkOut.toDateString() ? (
            <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="w-4 h-4 text-warning" />
                <span className="text-warning text-sm font-medium">
                  Select a different check-out date
                </span>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Calendar Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded"
            style={{
              background:
                "linear-gradient(135deg, #059669 0%, #047857 100%)",
            }}
          ></span>
          <span className="text-muted-foreground">Available</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded"
            style={{
              background:
                "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            }}
          ></span>
          <span className="text-muted-foreground">Your Pick</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded"
            style={{
              background:
                "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            }}
          ></span>
          <span className="text-muted-foreground">Check-in</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded"
            style={{
              background:
                "linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)",
            }}
          ></span>
          <span className="text-muted-foreground">Check-out</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded"
            style={{
              background:
                "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
            }}
          ></span>
          <span className="text-muted-foreground">Occupied</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded"
            style={{
              background:
                "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
            }}
          ></span>
          <span className="text-muted-foreground">Full</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-secondary"></span>
          <span className="text-muted-foreground">Unavailable</span>
        </span>
      </div>
    </div>
  );
}
