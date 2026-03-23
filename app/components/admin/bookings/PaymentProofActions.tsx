"use client";

import type { Booking, PaymentProof } from "../../../lib/types";

interface PaymentProofActionsProps {
  selectedPaymentProof: PaymentProof;
  selectedBooking: Booking | null;
  paymentProofLoading: boolean;
  verificationNotes: string;
  rejectionReason: string;
  customRejectionReason: string;
  rejectionReasons: { value: string; label: string }[];
  onSetVerificationNotes: (notes: string) => void;
  onSetRejectionReason: (reason: string) => void;
  onSetCustomRejectionReason: (reason: string) => void;
  onPaymentProofAction: (action: "approve" | "reject", proofId: number) => void;
  onShowError: (message: string) => void;
  onClose: () => void;
}

export function PaymentProofActions({
  selectedPaymentProof,
  selectedBooking,
  paymentProofLoading,
  verificationNotes,
  rejectionReason,
  customRejectionReason,
  rejectionReasons,
  onSetVerificationNotes,
  onSetRejectionReason,
  onSetCustomRejectionReason,
  onPaymentProofAction,
  onShowError,
  onClose,
}: PaymentProofActionsProps) {
  return (
    <>
      {/* Enhanced Admin Verification Interface */}
      {selectedPaymentProof.status === "pending" &&
        selectedBooking?.status !== "cancelled" && (
          <div className="bg-gradient-to-br from-muted to-muted border border-border rounded-xl p-5 space-y-5">
            {/* Rejection Reason Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-destructive rounded-full"></div>
                <label className="block text-sm font-semibold text-foreground">
                  Rejection Reason (Required for rejection)
                </label>
              </div>
              <select
                value={rejectionReason}
                onChange={(e) => {
                  onSetRejectionReason(e.target.value);
                  if (e.target.value !== "custom") {
                    onSetCustomRejectionReason("");
                  }
                }}
                className="w-full px-4 py-3 border-2 border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-foreground bg-card/80 backdrop-blur-sm transition-all duration-200"
              >
                {rejectionReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>

              {/* Custom Rejection Reason */}
              {rejectionReason === "custom" && (
                <textarea
                  value={customRejectionReason}
                  onChange={(e) =>
                    onSetCustomRejectionReason(e.target.value)
                  }
                  placeholder="Please specify the reason for rejection..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-destructive/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-foreground placeholder:text-muted-foreground resize-none transition-all duration-200 bg-card/80 backdrop-blur-sm"
                />
              )}

              <p className="text-xs text-destructive flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                User will be notified via email and SMS with this reason
                and can resubmit payment proof
              </p>
            </div>

            {/* Admin Notes */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <label className="block text-sm font-semibold text-foreground">
                  Additional Notes (Optional)
                </label>
              </div>
              <textarea
                value={verificationNotes}
                onChange={(e) => onSetVerificationNotes(e.target.value)}
                placeholder="Add verification notes, concerns, or additional information for internal reference..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-foreground placeholder:text-muted-foreground resize-none transition-all duration-200 bg-card/80 backdrop-blur-sm"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Internal notes for record keeping and future reference
              </p>
            </div>
          </div>
        )}

      {/* Existing Admin Notes */}
      {selectedPaymentProof.admin_notes && (
        <div className="bg-gradient-to-br from-warning/10 to-warning/5 border-l-4 border-warning rounded-r-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <svg
              className="w-5 h-5 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h4 className="font-semibold text-warning">
              Previous Admin Notes
            </h4>
          </div>
          <p className="text-warning text-sm leading-relaxed bg-card/50 rounded-lg p-3">
            {selectedPaymentProof.admin_notes}
          </p>
          {selectedPaymentProof.verified_at && (
            <p className="text-primary text-xs mt-2">
              Verified on:{" "}
              {new Date(
                selectedPaymentProof.verified_at,
              ).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-2">
        {selectedPaymentProof.status === "pending" &&
        selectedBooking?.status !== "cancelled" ? (
          <>
            <button
              onClick={() =>
                onPaymentProofAction(
                  "approve",
                  selectedPaymentProof.id,
                )
              }
              disabled={paymentProofLoading}
              className="flex-1 group relative bg-gradient-to-r from-success to-success hover:from-success/90 hover:to-success/90 disabled:from-muted-foreground disabled:to-muted-foreground text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <span className="flex items-center justify-center gap-2">
                {paymentProofLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 transition-transform group-hover:scale-110"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Approve Payment
                  </>
                )}
              </span>
            </button>
            <button
              onClick={() => {
                // Validate rejection reason is selected
                if (
                  !rejectionReason ||
                  (rejectionReason === "custom" &&
                    !customRejectionReason.trim())
                ) {
                  onShowError(
                    "Please select a reason for rejection before proceeding.",
                  );
                  return;
                }
                onPaymentProofAction(
                  "reject",
                  selectedPaymentProof.id,
                );
              }}
              disabled={paymentProofLoading}
              className="flex-1 group relative bg-gradient-to-r from-destructive to-destructive hover:from-destructive/90 hover:to-destructive/90 disabled:from-muted-foreground disabled:to-muted-foreground text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <span className="flex items-center justify-center gap-2">
                {paymentProofLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 transition-transform group-hover:scale-110"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Reject Payment
                  </>
                )}
              </span>
            </button>
          </>
        ) : selectedBooking?.status === "cancelled" ? (
          <div className="w-full text-center py-4 px-4 bg-muted text-muted-foreground rounded-md text-sm font-medium border border-border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Booking Cancelled</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Payment review actions are disabled for cancelled bookings
            </p>
          </div>
        ) : (
          <div className="w-full text-center py-2 px-4 bg-muted text-muted-foreground rounded-md text-sm font-medium">
            Payment has been {selectedPaymentProof.status}
          </div>
        )}
        <button
          onClick={onClose}
          disabled={paymentProofLoading}
          className="py-2 px-4 bg-muted-foreground text-white rounded-md text-sm font-medium hover:bg-muted-foreground/90 transition disabled:opacity-50"
        >
          Close
        </button>
      </div>
    </>
  );
}
