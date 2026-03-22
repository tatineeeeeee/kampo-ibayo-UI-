"use client";

import Image from "next/image";
import type { Booking, PaymentProof, PaymentHistoryEntry } from "../../../lib/types";

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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Modal Header */}
        <div className="bg-gray-50 p-6 rounded-t-lg border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Payment Proof Verification
              </h2>
              <p className="text-gray-600 text-sm">
                Review and verify payment submission
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:shadow-md transition"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Payment Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-black mb-3">
              Payment Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-black">Amount:</span>
                <p className="text-black">
                  ₱{selectedPaymentProof.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-black">Method:</span>
                <p className="text-black">
                  {selectedPaymentProof.payment_method}
                </p>
              </div>
              <div>
                <span className="font-medium text-black">Reference:</span>
                <p className="text-black">
                  {selectedPaymentProof.reference_number || "N/A"}
                </p>
              </div>
              <div>
                <span className="font-medium text-black">Status:</span>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    selectedPaymentProof.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedPaymentProof.status === "verified"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedPaymentProof.status}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-black">Uploaded:</span>
                <p className="text-black">
                  {new Date(
                    selectedPaymentProof.uploaded_at,
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Summary Section */}
          {selectedPaymentProof.id > 0 && paymentSummary && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Summary
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    Total Amount
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    ₱{paymentSummary.totalAmount.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    Total Paid
                  </div>
                  <div className="text-xl font-bold text-green-700">
                    ₱{paymentSummary.totalPaid.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    Pending
                  </div>
                  <div className="text-xl font-bold text-yellow-600">
                    ₱{paymentSummary.pendingAmount.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    Remaining Balance
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      paymentSummary.remainingBalance > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    ₱{paymentSummary.remainingBalance.toLocaleString()}
                  </div>
                  {paymentSummary.remainingBalance === 0 && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      ✓ Fully Paid
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment History Section */}
          {selectedPaymentProof.id > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payment History
                  </h3>
                  {paymentHistory.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {paymentHistory.length} submission
                      {paymentHistory.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onSetShowPaymentHistory(!showPaymentHistory)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  {showPaymentHistory ? "Hide History" : "Show History"}
                </button>
              </div>

              {paymentHistoryLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Loading payment history...
                  </span>
                </div>
              ) : showPaymentHistory && paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {paymentHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className={`border rounded-lg p-4 ${
                        entry.isLatest
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Submission #{entry.sequenceNumber}
                          </span>
                          {entry.isLatest && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              Current
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.status === "verified"
                                ? "bg-green-100 text-green-800"
                                : entry.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.uploadedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">
                            Amount:
                          </span>
                          <p className="text-gray-800">
                            ₱{entry.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Method:
                          </span>
                          <p className="text-gray-800">
                            {entry.paymentMethod}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Reference:
                          </span>
                          <p className="text-gray-800">
                            {entry.referenceNumber || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Status:
                          </span>
                          <p className="text-gray-800">{entry.status}</p>
                        </div>
                      </div>

                      {entry.adminNotes && (
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                          <span className="text-xs font-medium text-amber-800">
                            Admin Notes:
                          </span>
                          <p className="text-xs text-amber-700 mt-1">
                            {entry.adminNotes}
                          </p>
                        </div>
                      )}

                      {entry.verifiedAt && (
                        <div className="mt-2 text-xs text-gray-500">
                          Verified on:{" "}
                          {new Date(entry.verifiedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : showPaymentHistory && paymentHistory.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">
                    No payment history found for this booking.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Payment Proof Image */}
          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                Current Payment Proof
              </h3>
            </div>

            <div
              className="relative group cursor-pointer"
              onClick={() =>
                selectedPaymentProof?.proof_image_url &&
                onSetImageZoomed(true)
              }
            >
              {/* Image Container */}
              <div className="relative overflow-hidden rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 transition-all duration-300 group-hover:border-blue-300 group-hover:shadow-md">
                {selectedPaymentProof?.proof_image_url ? (
                  <Image
                    src={selectedPaymentProof.proof_image_url}
                    alt="Payment Proof"
                    width={500}
                    height={400}
                    className="w-full h-auto max-h-80 object-contain pointer-events-none transition-all duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-80 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 text-gray-400">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">
                        No image available
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlay with zoom hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 shadow-lg">
                    <svg
                      className="w-6 h-6 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Action hint */}
              <p className="text-xs text-gray-500 mt-2 text-center font-medium">
                Click to view full size
              </p>
            </div>
          </div>

          {/* Full Screen Image Modal */}
          {imageZoomed && selectedPaymentProof?.proof_image_url && (
            <div className="fixed inset-0 bg-black z-[70] flex items-center justify-center">
              {/* Backdrop - Click to close */}
              <div
                className="absolute inset-0 bg-black cursor-pointer"
                onClick={() => onSetImageZoomed(false)}
              />

              {/* Image Container */}
              <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
                {selectedPaymentProof?.proof_image_url ? (
                  <Image
                    src={selectedPaymentProof.proof_image_url}
                    alt="Payment Proof - Full View"
                    width={1920}
                    height={1080}
                    className="max-w-full max-h-full object-contain cursor-pointer"
                    onClick={() => onSetImageZoomed(false)}
                    priority
                  />
                ) : (
                  <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-white text-lg">No image available</p>
                    <p className="text-gray-400 text-sm mt-2">
                      The payment proof image could not be loaded
                    </p>
                    <button
                      onClick={() => onSetImageZoomed(false)}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => onSetImageZoomed(false)}
                className="absolute top-4 right-4 z-20 bg-black/70 hover:bg-black/90 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors duration-200"
                aria-label="Close"
              >
                ×
              </button>

              {/* Instructions */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 text-white text-sm px-4 py-2 rounded">
                Press ESC or click anywhere to close
              </div>
            </div>
          )}

          {/* Enhanced Admin Verification Interface */}
          {selectedPaymentProof.status === "pending" &&
            selectedBooking?.status !== "cancelled" && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 space-y-5">
                {/* Rejection Reason Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <label className="block text-sm font-semibold text-gray-900">
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/80 backdrop-blur-sm transition-all duration-200"
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
                      className="w-full px-4 py-3 border-2 border-red-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    />
                  )}

                  <p className="text-xs text-red-600 flex items-center gap-1">
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <label className="block text-sm font-semibold text-gray-900">
                      Additional Notes (Optional)
                    </label>
                  </div>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => onSetVerificationNotes(e.target.value)}
                    placeholder="Add verification notes, concerns, or additional information for internal reference..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
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
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-r-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <svg
                  className="w-5 h-5 text-amber-600"
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
                <h4 className="font-semibold text-amber-800">
                  Previous Admin Notes
                </h4>
              </div>
              <p className="text-amber-700 text-sm leading-relaxed bg-white/50 rounded-lg p-3">
                {selectedPaymentProof.admin_notes}
              </p>
              {selectedPaymentProof.verified_at && (
                <p className="text-blue-600 text-xs mt-2">
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
                  className="flex-1 group relative bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 disabled:hover:scale-100 disabled:hover:shadow-none"
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
                  className="flex-1 group relative bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:hover:scale-100 disabled:hover:shadow-none"
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
              <div className="w-full text-center py-4 px-4 bg-gray-100 text-gray-600 rounded-md text-sm font-medium border border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-gray-500"
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
                <p className="text-xs text-gray-500">
                  Payment review actions are disabled for cancelled bookings
                </p>
              </div>
            ) : (
              <div className="w-full text-center py-2 px-4 bg-gray-100 text-gray-600 rounded-md text-sm font-medium">
                Payment has been {selectedPaymentProof.status}
              </div>
            )}
            <button
              onClick={onClose}
              disabled={paymentProofLoading}
              className="py-2 px-4 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 transition disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
