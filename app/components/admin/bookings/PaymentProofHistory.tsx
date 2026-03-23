"use client";

import type { PaymentHistoryEntry } from "../../../lib/types";

interface PaymentProofHistoryProps {
  paymentHistory: PaymentHistoryEntry[];
  paymentHistoryLoading: boolean;
  showPaymentHistory: boolean;
  paymentSummary: {
    totalAmount: number;
    totalPaid: number;
    pendingAmount: number;
    remainingBalance: number;
  } | null;
  proofId: number;
  onSetShowPaymentHistory: (show: boolean) => void;
}

export function PaymentProofHistory({
  paymentHistory,
  paymentHistoryLoading,
  showPaymentHistory,
  paymentSummary,
  proofId,
  onSetShowPaymentHistory,
}: PaymentProofHistoryProps) {
  return (
    <>
      {/* Payment Summary Section */}
      {proofId > 0 && paymentSummary && (
        <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <h3 className="text-lg font-semibold text-foreground">
              Payment Summary
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/60 p-4 rounded-lg border border-success/20">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Total Amount
              </div>
              <div className="text-xl font-bold text-foreground">
                ₱{paymentSummary.totalAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-card/60 p-4 rounded-lg border border-success/20">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Total Paid
              </div>
              <div className="text-xl font-bold text-success">
                ₱{paymentSummary.totalPaid.toLocaleString()}
              </div>
            </div>
            <div className="bg-card/60 p-4 rounded-lg border border-success/20">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Pending
              </div>
              <div className="text-xl font-bold text-warning">
                ₱{paymentSummary.pendingAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-card/60 p-4 rounded-lg border border-success/20">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Remaining Balance
              </div>
              <div
                className={`text-xl font-bold ${
                  paymentSummary.remainingBalance > 0
                    ? "text-destructive"
                    : "text-success"
                }`}
              >
                ₱{paymentSummary.remainingBalance.toLocaleString()}
              </div>
              {paymentSummary.remainingBalance === 0 && (
                <div className="text-xs text-success font-medium mt-1">
                  ✓ Fully Paid
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment History Section */}
      {proofId > 0 && (
        <div className="bg-gradient-to-br from-primary/10 to-info/5 border border-info/20 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <h3 className="text-lg font-semibold text-foreground">
                Payment History
              </h3>
              {paymentHistory.length > 0 && (
                <span className="bg-info/10 text-info px-2 py-1 rounded-full text-xs font-medium">
                  {paymentHistory.length} submission
                  {paymentHistory.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              onClick={() => onSetShowPaymentHistory(!showPaymentHistory)}
              className="text-primary hover:text-primary text-sm font-medium transition-colors"
            >
              {showPaymentHistory ? "Hide History" : "Show History"}
            </button>
          </div>

          {paymentHistoryLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">
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
                      ? "border-info/20 bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Submission #{entry.sequenceNumber}
                      </span>
                      {entry.isLatest && (
                        <span className="bg-success/10 text-success px-2 py-1 rounded-full text-xs font-medium">
                          Current
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.status === "verified"
                            ? "bg-success/10 text-success"
                            : entry.status === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/10 text-warning"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
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
                      <span className="font-medium text-muted-foreground">
                        Amount:
                      </span>
                      <p className="text-foreground">
                        ₱{entry.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Method:
                      </span>
                      <p className="text-foreground">
                        {entry.paymentMethod}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Reference:
                      </span>
                      <p className="text-foreground">
                        {entry.referenceNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Status:
                      </span>
                      <p className="text-foreground">{entry.status}</p>
                    </div>
                  </div>

                  {entry.adminNotes && (
                    <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded">
                      <span className="text-xs font-medium text-warning">
                        Admin Notes:
                      </span>
                      <p className="text-xs text-warning mt-1">
                        {entry.adminNotes}
                      </p>
                    </div>
                  )}

                  {entry.verifiedAt && (
                    <div className="mt-2 text-xs text-muted-foreground">
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
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">
                No payment history found for this booking.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
