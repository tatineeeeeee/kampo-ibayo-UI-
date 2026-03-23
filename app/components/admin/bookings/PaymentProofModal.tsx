"use client";

import type { Booking, PaymentProof, PaymentHistoryEntry } from "../../../lib/types";
import { PaymentProofViewer } from "./PaymentProofViewer";
import { PaymentProofActions } from "./PaymentProofActions";
import { PaymentProofHistory } from "./PaymentProofHistory";

interface PaymentProofModalProps {
  selectedPaymentProof: PaymentProof;
  selectedBooking: Booking | null;
  paymentHistory: PaymentHistoryEntry[];
  paymentHistoryLoading: boolean;
  showPaymentHistory: boolean;
  paymentSummary: {
    totalAmount: number;
    totalPaid: number;
    pendingAmount: number;
    remainingBalance: number;
  } | null;
  paymentProofLoading: boolean;
  imageZoomed: boolean;
  verificationNotes: string;
  rejectionReason: string;
  customRejectionReason: string;
  rejectionReasons: { value: string; label: string }[];
  onClose: () => void;
  onSetShowPaymentHistory: (show: boolean) => void;
  onSetImageZoomed: (zoomed: boolean) => void;
  onSetVerificationNotes: (notes: string) => void;
  onSetRejectionReason: (reason: string) => void;
  onSetCustomRejectionReason: (reason: string) => void;
  onPaymentProofAction: (action: "approve" | "reject", proofId: number) => void;
  onShowError: (message: string) => void;
}

export function PaymentProofModal({
  selectedPaymentProof,
  selectedBooking,
  paymentHistory,
  paymentHistoryLoading,
  showPaymentHistory,
  paymentSummary,
  paymentProofLoading,
  imageZoomed,
  verificationNotes,
  rejectionReason,
  customRejectionReason,
  rejectionReasons,
  onClose,
  onSetShowPaymentHistory,
  onSetImageZoomed,
  onSetVerificationNotes,
  onSetRejectionReason,
  onSetCustomRejectionReason,
  onPaymentProofAction,
  onShowError,
}: PaymentProofModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Modal Header */}
        <div className="bg-muted p-6 rounded-t-lg border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Payment Proof Verification
              </h2>
              <p className="text-muted-foreground text-sm">
                Review and verify payment submission
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-muted-foreground text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-card hover:shadow-md transition"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Payment Details */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Payment Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-foreground">Amount:</span>
                <p className="text-foreground">
                  ₱{selectedPaymentProof.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-foreground">Method:</span>
                <p className="text-foreground">
                  {selectedPaymentProof.payment_method}
                </p>
              </div>
              <div>
                <span className="font-medium text-foreground">Reference:</span>
                <p className="text-foreground">
                  {selectedPaymentProof.reference_number || "N/A"}
                </p>
              </div>
              <div>
                <span className="font-medium text-foreground">Status:</span>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    selectedPaymentProof.status === "pending"
                      ? "bg-warning/10 text-warning"
                      : selectedPaymentProof.status === "verified"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {selectedPaymentProof.status}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-foreground">Uploaded:</span>
                <p className="text-foreground">
                  {new Date(
                    selectedPaymentProof.uploaded_at,
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Summary & History */}
          <PaymentProofHistory
            paymentHistory={paymentHistory}
            paymentHistoryLoading={paymentHistoryLoading}
            showPaymentHistory={showPaymentHistory}
            paymentSummary={paymentSummary}
            proofId={selectedPaymentProof.id}
            onSetShowPaymentHistory={onSetShowPaymentHistory}
          />

          {/* Payment Proof Image & Zoom */}
          <PaymentProofViewer
            selectedPaymentProof={selectedPaymentProof}
            imageZoomed={imageZoomed}
            onSetImageZoomed={onSetImageZoomed}
          />

          {/* Admin Verification Interface & Action Buttons */}
          <PaymentProofActions
            selectedPaymentProof={selectedPaymentProof}
            selectedBooking={selectedBooking}
            paymentProofLoading={paymentProofLoading}
            verificationNotes={verificationNotes}
            rejectionReason={rejectionReason}
            customRejectionReason={customRejectionReason}
            rejectionReasons={rejectionReasons}
            onSetVerificationNotes={onSetVerificationNotes}
            onSetRejectionReason={onSetRejectionReason}
            onSetCustomRejectionReason={onSetCustomRejectionReason}
            onPaymentProofAction={onPaymentProofAction}
            onShowError={onShowError}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
