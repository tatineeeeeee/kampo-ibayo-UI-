"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Check,
} from "lucide-react";
import type { BookingWithPayment, PaymentHistoryEntry, PaymentSummary } from "../../lib/types";

interface PaymentHistoryListProps {
  booking: BookingWithPayment | null;
  paymentHistory: PaymentHistoryEntry[];
  paymentSummary: PaymentSummary;
  showPaymentHistory: boolean;
  setShowPaymentHistory: (show: boolean) => void;
  remainingAmount: number;
}

export default function PaymentHistoryList({
  booking,
  paymentHistory,
  paymentSummary,
  showPaymentHistory,
  setShowPaymentHistory,
  remainingAmount,
}: PaymentHistoryListProps) {
  if (paymentSummary.totalSubmissions <= 0 && paymentSummary.totalPaid <= 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="bg-primary/30 p-1.5 rounded-full">
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          Payment History
          {paymentSummary.totalSubmissions > 0 && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
              {paymentSummary.totalSubmissions} submission
              {paymentSummary.totalSubmissions !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
        {paymentSummary.totalSubmissions > 0 && (
          <button
            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            {showPaymentHistory ? "Hide Details" : "Show Details"}
          </button>
        )}
      </div>

      {/* Payment Balance Summary */}
      {booking && paymentSummary.totalPaid > 0 && (
        <div className="mb-4 p-4 bg-green-900/20 border border-green-600/50 rounded-lg">
          <h3 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
            <span>💰</span> Payment Balance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Total Booking</p>
              <p className="text-foreground font-semibold text-lg">
                ₱{booking.total_amount.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Verified Payments</p>
              <p className="text-green-400 font-semibold text-lg">
                ₱{paymentSummary.totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Remaining Balance</p>
              <p className="font-semibold text-lg text-orange-400">
                ₱{Math.max(0, remainingAmount).toLocaleString()}
              </p>
            </div>
          </div>

          {paymentSummary.pendingAmount > 0 && (
            <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600/50 rounded">
              <p className="text-yellow-300 text-sm flex items-center gap-1">
                <span className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                <span className="font-medium">Pending Review:</span> ₱
                {paymentSummary.pendingAmount.toLocaleString()}
              </p>
            </div>
          )}

          {remainingAmount <= 0 && (
            <div className="mt-3 p-3 bg-green-900/20 border border-green-600/50 rounded-lg">
              <p className="text-green-300 text-sm font-medium flex items-center gap-1 mb-3">
                <CheckCircle className="w-4 h-4" /> Booking fully paid! No
                additional payment required.
              </p>
              <a
                href="/bookings"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-foreground px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                ← Back to My Bookings
              </a>
            </div>
          )}
        </div>
      )}

      {/* Payment History Details */}
      {showPaymentHistory && paymentHistory.length > 0 && (
        <div className="space-y-3">
          {paymentHistory.map((entry) => {
            const isRejected = entry.status === "rejected";
            const isPending = entry.status === "pending";
            const isVerified = entry.status === "verified";

            // Extract rejection reason from admin notes
            let rejectionReason = null;
            if (isRejected && entry.adminNotes) {
              const reasonMatch = entry.adminNotes.match(
                /REJECTION REASON: (.+?)(?:\n|$)/
              );
              rejectionReason = reasonMatch
                ? reasonMatch[1]
                : entry.adminNotes;
            }

            return (
              <div
                key={entry.id}
                className="p-4 rounded-lg border bg-background/20 border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Attempt #{entry.attemptNumber} •{" "}
                      {new Date(entry.uploadedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                    {entry.isLatest && (
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                        Latest
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      isRejected
                        ? "bg-red-600/30 text-red-300"
                        : isPending
                        ? "bg-yellow-600/30 text-yellow-300"
                        : "bg-green-600/30 text-green-300"
                    }`}
                  >
                    {isRejected ? (
                      <>
                        <AlertCircle className="w-3 h-3" /> Rejected
                      </>
                    ) : isPending ? (
                      <>
                        <span className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin inline-block"></span>{" "}
                        Under Review
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" /> Verified
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Method:</span>
                    <span className="text-foreground ml-1">
                      {entry.paymentMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="text-foreground ml-1">
                      ₱{entry.amount.toLocaleString()}
                    </span>
                  </div>
                  {entry.referenceNumber && (
                    <div>
                      <span className="text-muted-foreground">Ref:</span>
                      <span className="text-foreground ml-1">
                        {entry.referenceNumber}
                      </span>
                    </div>
                  )}
                </div>

                {isRejected && rejectionReason && (
                  <div className="mt-3 p-3 bg-red-800/30 border border-red-600/30 rounded">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-red-300 font-medium text-sm">
                          Reason for rejection:
                        </h4>
                        <p className="text-red-200 text-sm mt-1">
                          {rejectionReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isPending && (
                  <div className="mt-3 p-3 bg-yellow-800/30 border border-yellow-600/30 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-yellow-200 text-sm">
                        Currently under admin review. You will be notified
                        via email once reviewed.
                      </p>
                    </div>
                  </div>
                )}

                {isVerified && entry.verifiedAt && (
                  <div className="mt-3 p-2 bg-green-800/30 border border-green-600/30 rounded">
                    <p className="text-green-200 text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Verified on{" "}
                      {new Date(entry.verifiedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
