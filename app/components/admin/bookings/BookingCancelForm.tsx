"use client";

import type { Booking } from "../../../lib/types";

interface BookingCancelFormProps {
  selectedBooking: Booking;
  showConfirmCancel: boolean;
  shouldRefund: boolean;
  isProcessing: boolean;
  adminCancellationReason: string;
  paymentSummary: {
    totalAmount: number;
    totalPaid: number;
    pendingAmount: number;
    remainingBalance: number;
  } | null;
  onSetShowCancelModal: (show: boolean) => void;
  onSetShowConfirmCancel: (show: boolean) => void;
  onSetShouldRefund: (refund: boolean) => void;
  onSetAdminCancellationReason: (reason: string) => void;
  onAdminCancelBooking: (bookingId: number, shouldRefund: boolean) => void;
}

export function BookingCancelForm({
  selectedBooking,
  showConfirmCancel,
  shouldRefund,
  isProcessing,
  adminCancellationReason,
  paymentSummary,
  onSetShowCancelModal,
  onSetShowConfirmCancel,
  onSetShouldRefund,
  onSetAdminCancellationReason,
  onAdminCancelBooking,
}: BookingCancelFormProps) {
  return (
    <div className="space-y-4">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div
          className={`flex items-center gap-2 ${
            !showConfirmCancel ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              !showConfirmCancel
                ? "bg-destructive text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </div>
          <span className="text-sm font-medium hidden sm:inline">
            Reason
          </span>
        </div>
        <div className="w-8 h-0.5 bg-muted"></div>
        <div
          className={`flex items-center gap-2 ${
            showConfirmCancel ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              showConfirmCancel
                ? "bg-destructive text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
          <span className="text-sm font-medium hidden sm:inline">
            Confirm
          </span>
        </div>
      </div>

      {/* Warning Banner for Confirmed Bookings */}
      {selectedBooking.status === "confirmed" && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h4 className="text-destructive font-semibold text-sm">
            Cancelling a Confirmed Booking
          </h4>
          <p className="text-destructive text-xs mt-1">
            Payment verified • User will be notified via email and
            SMS • Refund may be required
          </p>
        </div>
      )}

      {!showConfirmCancel ? (
        /* STEP 1: Enter Reason */
        <div className="space-y-4">
          <div>
            <label className="block text-foreground font-medium mb-2 text-sm">
              Why are you cancelling this booking?
            </label>
            <textarea
              value={adminCancellationReason}
              onChange={(e) =>
                onSetAdminCancellationReason(e.target.value)
              }
              placeholder={
                selectedBooking.status === "confirmed"
                  ? "e.g., User requested cancellation, Emergency situation, Overbooking..."
                  : "e.g., User no-show, Payment issue, User request..."
              }
              className="w-full p-3 border border-border rounded-lg resize-none text-foreground focus:border-destructive focus:ring-2 focus:ring-destructive/10 focus:outline-none transition"
              rows={3}
              maxLength={200}
              disabled={isProcessing}
            />
            <div className="flex justify-between mt-1">
              <p className="text-muted-foreground text-xs">
                This reason will be shown to the user
              </p>
              <p className="text-muted-foreground text-xs">
                {adminCancellationReason.length}/200
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onSetShowConfirmCancel(true)}
              disabled={
                !adminCancellationReason.trim() || isProcessing
              }
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition ${
                adminCancellationReason.trim() && !isProcessing
                  ? "bg-destructive text-white hover:bg-destructive/90 shadow-sm"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              Continue to Confirmation →
            </button>
            <button
              onClick={() => {
                onSetShowCancelModal(false);
                onSetAdminCancellationReason("");
                onSetShowConfirmCancel(false);
              }}
              disabled={isProcessing}
              className="px-6 py-3 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted transition"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: Confirm & Choose Refund */
        <div className="space-y-4">
          {/* Cancellation Summary */}
          <div className="bg-muted rounded-lg p-4 border border-border">
            <h4 className="text-foreground font-semibold text-sm mb-3">
              Cancellation Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Guest</p>
                <p className="text-foreground font-medium">
                  {selectedBooking.guest_name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Booking</p>
                <p className="text-foreground font-medium">
                  KB-
                  {selectedBooking.id.toString().padStart(4, "0")}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Reason</p>
                <p className="text-foreground text-sm italic">
                  &ldquo;{adminCancellationReason}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Refund Options - Enhanced UI */}
          {(selectedBooking.status === "confirmed" ||
            selectedBooking.payment_status === "paid" ||
            selectedBooking.payment_intent_id) && (
            <div className="space-y-3">
              <h4 className="text-foreground font-semibold text-sm">
                Refund Decision
              </h4>

              {/* No Refund Option */}
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                  !shouldRefund
                    ? "border-destructive bg-destructive/10"
                    : "border-border hover:border-border bg-card"
                }`}
              >
                <input
                  type="radio"
                  name="refundOption"
                  checked={!shouldRefund}
                  onChange={() => onSetShouldRefund(false)}
                  className="mt-1 text-destructive focus:ring-ring"
                />
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      !shouldRefund
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    Cancel without refund
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Guest will not receive any refund. Use for
                    policy violations or no-shows.
                  </p>
                </div>
                <span className="text-muted-foreground font-semibold text-sm">
                  ₱0
                </span>
              </label>

              {/* With Refund Option */}
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                  shouldRefund
                    ? "border-success bg-success/10"
                    : "border-border hover:border-border bg-card"
                }`}
              >
                <input
                  type="radio"
                  name="refundOption"
                  checked={shouldRefund}
                  onChange={() => onSetShouldRefund(true)}
                  className="mt-1 text-success focus:ring-ring"
                />
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      shouldRefund
                        ? "text-success"
                        : "text-foreground"
                    }`}
                  >
                    Cancel with refund
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Refund the actual amount paid by the guest.
                  </p>
                </div>
                <span className="text-success font-bold text-sm">
                  ₱
                  {(
                    paymentSummary?.totalPaid || 0
                  ).toLocaleString()}
                </span>
              </label>

              {/* Refund Note */}
              {shouldRefund &&
                (paymentSummary?.totalPaid || 0) > 0 && (
                  <div className="bg-primary/10 border border-info/20 rounded-lg p-3">
                    <p className="text-primary text-xs">
                      <strong>Manual Processing Required:</strong>{" "}
                      Process the refund via GCash or Maya, then
                      coordinate with the guest. The refund status
                      will be marked as &quot;pending&quot; and
                      shown in the guest&apos;s booking history.
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() =>
                onAdminCancelBooking(
                  selectedBooking.id,
                  shouldRefund,
                )
              }
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition shadow-sm ${
                isProcessing
                  ? "bg-muted-foreground cursor-not-allowed"
                  : shouldRefund
                    ? "bg-success hover:bg-success/90"
                    : "bg-destructive hover:bg-destructive/90"
              } text-white`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : shouldRefund ? (
                `Cancel & Refund ₱${(
                  paymentSummary?.totalPaid || 0
                ).toLocaleString()}`
              ) : (
                "Cancel Without Refund"
              )}
            </button>
            <button
              onClick={() => {
                onSetShowConfirmCancel(false);
                onSetShouldRefund(false);
              }}
              disabled={isProcessing}
              className="px-6 py-3 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted transition disabled:opacity-50"
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
