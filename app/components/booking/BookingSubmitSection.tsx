"use client";

import { FaExclamationTriangle, FaSpinner, FaBan } from "react-icons/fa";

interface BookingSubmitSectionProps {
  canCreateBooking: boolean;
  isSubmitting: boolean;
  estimatedPrice: number | null;
  paymentType: "half" | "full";
}

export default function BookingSubmitSection({
  canCreateBooking,
  isSubmitting,
  estimatedPrice,
  paymentType,
}: BookingSubmitSectionProps) {
  return (
    <div>
      <button
        type="submit"
        disabled={
          !canCreateBooking ||
          isSubmitting ||
          (estimatedPrice !== null && estimatedPrice === 0)
        }
        className={`w-full font-bold py-3.5 rounded-2xl transition-all duration-200 text-base shadow-lg ${
          canCreateBooking && !isSubmitting && estimatedPrice !== 0
            ? "bg-primary text-white hover:bg-primary/90 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <FaSpinner className="animate-spin w-4 h-4" />
            <span>Processing Reservation...</span>
          </div>
        ) : canCreateBooking ? (
          estimatedPrice && estimatedPrice > 0 ? (
            paymentType === "half" ? (
              `Pay Down Payment — ₱${Math.round(
                estimatedPrice * 0.5,
              ).toLocaleString()}`
            ) : (
              `Pay Full Amount — ₱${estimatedPrice.toLocaleString()}`
            )
          ) : estimatedPrice === 0 ? (
            <span className="flex items-center justify-center gap-2">
              <FaExclamationTriangle className="w-4 h-4" /> Select Valid Dates
            </span>
          ) : (
            "Complete Booking Details"
          )
        ) : (
          <span className="flex items-center justify-center gap-2">
            <FaBan className="w-4 h-4" /> Booking Limit Reached
          </span>
        )}
      </button>
      {estimatedPrice !== null &&
        estimatedPrice > 0 &&
        canCreateBooking &&
        !isSubmitting && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            By reserving, you agree to our booking terms and conditions
          </p>
        )}
      {isSubmitting && (
        <p className="text-center text-xs text-primary mt-2 animate-pulse flex items-center justify-center gap-2">
          <FaSpinner className="w-3 h-3 animate-spin" /> Securing your
          reservation... Please don&apos;t close this page
        </p>
      )}
    </div>
  );
}
