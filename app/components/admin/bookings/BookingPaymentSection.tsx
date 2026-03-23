"use client";

import type { Booking } from "../../../lib/types";

interface BookingPaymentSectionProps {
  selectedBooking: Booking;
  paymentSummary: {
    totalAmount: number;
    totalPaid: number;
    pendingAmount: number;
    remainingBalance: number;
  } | null;
}

export function BookingPaymentSection({
  selectedBooking,
  paymentSummary,
}: BookingPaymentSectionProps) {
  return (
    <div className="bg-muted p-4 rounded-lg border border-border mb-3">
      <h4 className="text-sm font-semibold text-foreground mb-4">
        Payment Information
      </h4>

      {/* Payment Progress Bar */}
      {(() => {
        const requiredDownpayment =
          selectedBooking.payment_type === "full"
            ? selectedBooking.total_amount
            : Math.round(selectedBooking.total_amount * 0.5);
        const amountPaid = paymentSummary?.totalPaid || 0;
        const progressPercent = Math.min(
          100,
          Math.round((amountPaid / requiredDownpayment) * 100),
        );
        const isComplete = amountPaid >= requiredDownpayment;

        return (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">
                Payment Progress
              </span>
              <span
                className={`text-xs font-medium ${
                  isComplete ? "text-success" : "text-muted-foreground"
                }`}
              >
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isComplete ? "bg-success/100" : "bg-primary/100"
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        );
      })()}

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Online Payment */}
        <div className="space-y-3">
          <div className="pb-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Online Payment
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block">
              Required
            </span>
            <span className="text-sm font-semibold text-foreground">
              ₱
              {selectedBooking.payment_type === "full"
                ? selectedBooking.total_amount.toLocaleString()
                : Math.round(
                    selectedBooking.total_amount * 0.5,
                  ).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block">
              Paid
            </span>
            <span className="text-sm font-semibold text-success">
              ₱
              {paymentSummary
                ? paymentSummary.totalPaid.toLocaleString()
                : "0"}
            </span>
          </div>

          {(() => {
            const requiredDownpayment =
              selectedBooking.payment_type === "full"
                ? selectedBooking.total_amount
                : Math.round(selectedBooking.total_amount * 0.5);
            const amountPaid = paymentSummary?.totalPaid || 0;
            const stillOwedOnline = Math.max(
              0,
              requiredDownpayment - amountPaid,
            );

            return stillOwedOnline > 0 ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <span className="text-xs text-destructive block">
                  Remaining Balance
                </span>
                <span className="text-base font-bold text-destructive">
                  ₱{stillOwedOnline.toLocaleString()}
                </span>
                {(selectedBooking.reschedule_count || 0) > 0 && (
                  <p className="text-[10px] text-destructive mt-0.5">
                    Balance due after reschedule
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-success/10 border border-success/20 rounded-lg px-3 py-2 inline-block">
                <span className="text-xs font-medium text-success">
                  Fully Paid
                </span>
              </div>
            );
          })()}

          {paymentSummary &&
            (paymentSummary.pendingAmount ?? 0) > 0 && (
              <div>
                <span className="text-xs text-muted-foreground block">
                  Pending Review
                </span>
                <span className="text-sm font-medium text-warning">
                  ₱
                  {(
                    paymentSummary.pendingAmount ?? 0
                  ).toLocaleString()}
                </span>
              </div>
            )}
        </div>

        {/* Right Column - On-site Payment */}
        <div className="space-y-3">
          <div className="pb-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              On-site Payment
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block">
              Due at Check-in
            </span>
            <span className="text-sm font-semibold text-warning">
              ₱
              {selectedBooking.payment_type === "full"
                ? "0"
                : Math.round(
                    selectedBooking.total_amount * 0.5,
                  ).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block">
              Payment Type
            </span>
            <span className="text-sm font-medium text-foreground capitalize">
              {selectedBooking.payment_type === "full"
                ? "Full Payment"
                : "50% Downpayment"}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block">
              Status
            </span>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                selectedBooking.payment_status === "paid" ||
                selectedBooking.payment_status === "verified"
                  ? "bg-success/10 text-success"
                  : selectedBooking.payment_status === "payment_review"
                    ? "bg-info/10 text-info"
                    : selectedBooking.payment_status === "pending"
                      ? "bg-warning/10 text-warning"
                      : selectedBooking.payment_status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-foreground"
              }`}
            >
              {selectedBooking.payment_status === "paid" || selectedBooking.payment_status === "verified"
                ? "Paid"
                : selectedBooking.payment_status === "payment_review"
                  ? "Under Review"
                  : selectedBooking.payment_status === "pending"
                    ? "Pending Payment"
                    : selectedBooking.payment_status === "rejected"
                      ? "Rejected"
                      : selectedBooking.payment_status || "Pending Payment"}
            </span>
          </div>
        </div>
      </div>

      {/* Total Summary Bar */}
      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          Total Booking Value
        </span>
        <span className="text-lg font-bold text-foreground">
          ₱{selectedBooking.total_amount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
