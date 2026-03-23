"use client";

import React from "react";
import {
  CreditCard,
  Check,
  ChevronDown,
  Calendar,
  Users,
} from "lucide-react";
import type { BookingWithPayment, PaymentSummary } from "../../lib/types";

interface BookingDetailsSummaryProps {
  booking: BookingWithPayment;
  showBookingDetails: boolean;
  setShowBookingDetails: (show: boolean) => void;
  paymentSummary: PaymentSummary;
  remainingAmount: number;
}

export default function BookingDetailsSummary({
  booking,
  showBookingDetails,
  setShowBookingDetails,
  paymentSummary,
  remainingAmount,
}: BookingDetailsSummaryProps) {
  return (
    <div className="bg-muted/50 border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setShowBookingDetails(!showBookingDetails)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-muted-foreground/30 p-1.5 rounded-full">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="text-foreground font-medium text-sm">
              Booking #{booking.id}
            </p>
            <p className="text-muted-foreground text-xs flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(booking.check_in_date).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                )}{" "}
                -{" "}
                {new Date(booking.check_out_date).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                )}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {booking.number_of_guests}{" "}
                {booking.number_of_guests === 1 ? "guest" : "guests"}
              </span>
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            showBookingDetails ? "rotate-180" : ""
          }`}
        />
      </button>

      {showBookingDetails && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="pt-3 space-y-3">
            {/* Guest & Stay Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">Guest</span>
                <span className="text-foreground font-medium">
                  {booking.guest_name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">
                  Duration
                </span>
                <span className="text-foreground">
                  {(() => {
                    const checkIn = new Date(booking.check_in_date);
                    const checkOut = new Date(booking.check_out_date);
                    const nights = Math.ceil(
                      (checkOut.getTime() - checkIn.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return `${nights} ${
                      nights === 1 ? "night" : "nights"
                    }`;
                  })()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">
                  Status
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    booking.status === "confirmed"
                      ? "bg-green-900/30 text-green-400"
                      : booking.status === "pending"
                      ? "bg-yellow-900/30 text-yellow-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {booking.status
                    ? booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)
                    : "Pending"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">
                  Total Amount
                </span>
                <span className="text-foreground font-medium">
                  ₱{booking.total_amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Status */}
            {paymentSummary.totalPaid > 0 && (
              <div className="flex items-center gap-4 text-sm pt-2 border-t border-border">
                <span className="text-green-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> ₱
                  {paymentSummary.totalPaid.toLocaleString()} paid
                </span>
                {paymentSummary.pendingAmount > 0 && (
                  <span className="text-yellow-400">
                    • ₱{paymentSummary.pendingAmount.toLocaleString()}{" "}
                    pending
                  </span>
                )}
                {remainingAmount > 0 && (
                  <span className="text-orange-400">
                    • ₱{remainingAmount.toLocaleString()} remaining
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
