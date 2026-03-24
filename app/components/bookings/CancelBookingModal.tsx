"use client";

import { Tables } from "../../../database.types";
import { formatBookingNumber } from "../../utils/bookingNumber";
import { XCircle, AlertTriangle } from "lucide-react";

type Booking = Tables<"bookings">;

interface CancelBookingModalProps {
  booking: Booking;
  cancellationReason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: (bookingId: number) => void;
}

export function CancelBookingModal({
  booking,
  cancellationReason,
  onReasonChange,
  onClose,
  onConfirm,
}: CancelBookingModalProps) {
  const checkIn = new Date(booking.check_in_date);
  const now = new Date();
  const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
  const daysUntilCheckIn = hoursUntilCheckIn / 24;
  const downPayment = booking.total_amount * 0.5;

  let refundPercentage: number;
  let canCancel = true;

  if (daysUntilCheckIn >= 7) {
    refundPercentage = 100;
  } else if (daysUntilCheckIn >= 3) {
    refundPercentage = 50;
  } else {
    refundPercentage = 0;
    canCancel = false;
  }

  const refundAmount = Math.round(downPayment * (refundPercentage / 100));
  const canConfirmCancel = hoursUntilCheckIn >= 24;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-start justify-center pt-20 z-[60] p-4">
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-border/50 transform animate-in slide-in-from-top-4 fade-in duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-4">
          <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Cancel Booking</h3>
            <p className="text-sm text-muted-foreground">{formatBookingNumber(booking.id)}</p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="mx-5 mb-4">
          <div className="bg-muted rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Guest</span>
              <span className="text-sm text-foreground font-medium">{booking.guest_name}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Check-in</span>
              <span className="text-sm text-foreground">
                {booking.check_in_date
                  ? new Date(booking.check_in_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Amount</span>
              <span className="text-lg font-bold text-success">
                {booking.total_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Refund Information */}
        <div className="mx-5 mb-4">
          <div className="bg-primary/5 dark:bg-primary/5 border border-primary/20 dark:border-primary/20 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-primary/80 mb-2">Your Refund</h4>
            {!canCancel ? (
              <div className="text-center">
                <p className="text-destructive font-medium text-sm">
                  Cancellation not allowed within 3 days
                </p>
                <p className="text-destructive dark:text-destructive text-xs mt-1">
                  Please contact resort directly for assistance
                </p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-primary">Down Payment</span>
                  <span className="font-medium text-primary/80">
                    {downPayment.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-primary">
                    Refund Amount ({refundPercentage}%)
                  </span>
                  <span className="text-lg font-bold text-success">
                    {refundAmount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-primary">
                  Time until check-in: {Math.floor(daysUntilCheckIn)} days
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Reason */}
        <div className="mx-5 mb-4">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
            Reason for cancellation
          </label>
          <textarea
            value={cancellationReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Please tell us why you're cancelling (required)"
            className="w-full p-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-destructive focus:outline-none resize-none text-sm backdrop-blur-sm"
            rows={3}
            maxLength={200}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground">{cancellationReason.length}/200 characters</p>
            {!cancellationReason.trim() && <p className="text-xs text-destructive">Required</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 bg-muted hover:bg-muted text-muted-foreground px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-border"
          >
            Keep Booking
          </button>
          {!canConfirmCancel ? (
            <button
              disabled
              className="flex-1 bg-muted text-muted-foreground px-4 py-3 rounded-xl text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cannot Cancel
            </button>
          ) : (
            <button
              onClick={() => onConfirm(booking.id)}
              disabled={!cancellationReason.trim()}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                cancellationReason.trim()
                  ? "bg-destructive hover:bg-destructive/90 active:bg-destructive/80 text-foreground shadow-destructive/25"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <XCircle className="w-4 h-4" />
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
