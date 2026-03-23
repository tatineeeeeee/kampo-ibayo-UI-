"use client";

import { Footprints } from "lucide-react";
import { displayPhoneNumber } from "../../../utils/phoneUtils";
import { formatBookingNumber } from "../../../utils/bookingNumber";
import type { Booking } from "../../../lib/types";

interface BookingInfoSectionProps {
  selectedBooking: Booking;
  paymentSummary: {
    totalAmount: number;
    totalPaid: number;
    pendingAmount: number;
    remainingBalance: number;
  } | null;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

export function BookingInfoSection({
  selectedBooking,
  paymentSummary,
  formatDate,
  getStatusColor,
}: BookingInfoSectionProps) {
  return (
    <>
      {/* Booking Header Card - Clean Light Style */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              {formatBookingNumber(selectedBooking.id)}
            </h3>
            <p className="text-muted-foreground text-sm">
              {selectedBooking.guest_name}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Booked on{" "}
              {selectedBooking.created_at
                ? formatDate(selectedBooking.created_at)
                : "N/A"}{" "}
              • ID: {selectedBooking.id}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-md text-xs font-semibold text-white ${getStatusColor(
                selectedBooking.status || "pending",
              )}`}
            >
              {(selectedBooking.status || "pending")
                .charAt(0)
                .toUpperCase() +
                (selectedBooking.status || "pending").slice(1)}
            </span>
          </div>
        </div>

        {/* Quick Info Grid - Simple Clean Layout */}
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
            <p className="text-xs text-success font-medium mb-1">
              Check-in
            </p>
            <p className="font-semibold text-foreground">
              {formatDate(selectedBooking.check_in_date)}
            </p>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-xs text-destructive font-medium mb-1">
              Check-out
            </p>
            <p className="font-semibold text-foreground">
              {formatDate(selectedBooking.check_out_date)}
            </p>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg border border-info/20">
            <p className="text-xs text-primary font-medium mb-1">
              Guests
            </p>
            <p className="font-semibold text-foreground">
              {selectedBooking.number_of_guests} people
            </p>
          </div>
          <div className="text-center p-3 bg-warning/10 rounded-lg border border-warning/20">
            <p className="text-xs text-warning font-medium mb-1">
              Total Booking Value
            </p>
            <p className="font-semibold text-success">
              ₱{selectedBooking.total_amount.toLocaleString()}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              {selectedBooking.payment_type === "full" ? (
                <div className="flex justify-between">
                  <span>Full Payment Required:</span>
                  <span className="font-medium text-primary">
                    ₱{selectedBooking.total_amount.toLocaleString()}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Down Payment:</span>
                    <span className="font-medium text-success">
                      ₱
                      {Math.round(
                        selectedBooking.total_amount * 0.5,
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pay on Arrival:</span>
                    <span className="font-medium text-warning">
                      ₱
                      {Math.round(
                        selectedBooking.total_amount * 0.5,
                      ).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-muted p-4 rounded-lg border border-border mb-3">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Contact Information
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Guest Name</p>
            <p className="text-foreground font-medium">
              {selectedBooking.guest_name}
            </p>
          </div>
          {selectedBooking.guest_email && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <a
                href={`mailto:${selectedBooking.guest_email}`}
                className="text-primary hover:text-primary hover:underline font-medium"
              >
                {selectedBooking.guest_email}
              </a>
            </div>
          )}
          {selectedBooking.guest_phone && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <a
                href={`tel:${selectedBooking.guest_phone}`}
                className="text-primary hover:text-primary hover:underline font-medium"
              >
                {displayPhoneNumber(selectedBooking.guest_phone)}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Count */}
      {(selectedBooking.reschedule_count || 0) > 0 && (
        <div className="flex gap-2 mb-3">
          <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-bold rounded-full">
            Rescheduled {selectedBooking.reschedule_count}x
          </span>
        </div>
      )}

      {/* Special Requests */}
      {selectedBooking.special_requests && (() => {
        const cleanedText = selectedBooking.special_requests
          .replace(/^\[WALK-IN\]\s*/, '')
          .replace(/\[USER-RESCHEDULED\][^\n]*/g, '')
          .replace(/\[ADMIN-RESCHEDULED\][^\n]*/g, '')
          .trim();
        const isWalkIn = selectedBooking.special_requests.startsWith("[WALK-IN]");
        return (cleanedText || isWalkIn) ? (
          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20 mb-3">
            <h4 className="text-sm font-semibold text-warning mb-2 flex items-center gap-2">
              Special Requests
              {isWalkIn && (
                <span className="px-2 py-0.5 bg-info/10 text-info text-[10px] font-bold rounded-full inline-flex items-center gap-0.5">
                  <Footprints className="w-3 h-3" /> Walk-in Booking
                </span>
              )}
            </h4>
            {cleanedText && (
              <p className="text-foreground text-sm">{cleanedText}</p>
            )}
          </div>
        ) : null;
      })()}
    </>
  );
}
