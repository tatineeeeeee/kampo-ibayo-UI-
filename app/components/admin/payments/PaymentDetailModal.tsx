"use client";

import { formatBookingNumber } from "../../../utils/bookingNumber";

interface Payment {
  id: number;
  user: string;
  guest_name?: string;
  email: string;
  amount: number;
  date: string;
  check_in_date?: string;
  status: string;
  payment_intent_id: string | null;
  booking_status: string | null;
  payment_status: string | null;
  original_reference: string | null;
  original_method: string | null;
  original_amount: number | null;
  original_status: string | null;
  balance_reference: string | null;
  balance_method: string | null;
  balance_amount: number | null;
  balance_status: string | null;
  booking_id: number;
  verified_at: string | null;
  admin_notes: string | null;
  has_payment_proof: boolean;
  is_walk_in?: boolean;
  payment_type: string | null;
  total_amount: number | null;
  payment_proof_id: number | null;
  total_proofs: number;
  reference_number?: string;
  payment_method?: string;
  all_payment_proofs: Array<{
    id: number;
    amount: number;
    reference_number: string | null;
    payment_method: string;
    status: string;
    uploaded_at: string;
    verified_at: string | null;
    admin_notes: string | null;
    sequence: number;
  }>;
}

// ---------------------------------------------------------------------------
// Balance Payment Confirmation Modal
// ---------------------------------------------------------------------------

interface BalancePaymentModalProps {
  payment: Payment;
  processingBalance: boolean;
  onConfirm: (payment: Payment) => void;
  onClose: () => void;
}

export function BalancePaymentModal({
  payment,
  processingBalance,
  onConfirm,
  onClose,
}: BalancePaymentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full border border-border max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-muted p-4 sm:p-6 rounded-t-lg border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Mark Balance as Paid
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Confirm on-arrival payment
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-card hover:shadow-md transition"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Payment Details */}
          <div className="bg-primary/10 p-4 rounded-lg border border-info/20">
            <h3 className="text-sm font-semibold text-primary mb-3">
              Payment Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guest:</span>
                <span className="font-medium text-foreground">
                  {payment.user}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking:</span>
                <span className="font-medium text-foreground">
                  {formatBookingNumber(payment.booking_id)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-foreground">
                  ₱{payment.total_amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Paid (50%):</span>
                <span className="font-medium text-success">
                  ₱{payment.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-info/20 pt-2 mt-2">
                <span className="text-muted-foreground">Balance Due:</span>
                <span className="font-bold text-warning">
                  ₱
                  {payment.total_amount
                    ? (
                        payment.total_amount -
                        payment.amount
                      ).toLocaleString()
                    : "0"}
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-warning rounded-full flex items-center justify-center text-white text-sm font-bold">
                !
              </div>
              <h4 className="font-semibold text-warning">
                Confirm On-Arrival Payment
              </h4>
            </div>
            <p className="text-warning text-sm leading-relaxed">
              This will mark the remaining 50% balance as{" "}
              <strong>&quot;Paid on Arrival&quot;</strong>. Only confirm
              this action if the guest has physically paid the balance
              amount at check-in.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-muted p-6 rounded-b-lg border-t border-border">
          <div className="flex gap-3">
            <button
              onClick={() => onConfirm(payment)}
              disabled={processingBalance}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition shadow-sm ${
                processingBalance
                  ? "bg-muted-foreground cursor-not-allowed"
                  : "bg-success hover:bg-success/90"
              } text-white`}
            >
              {processingBalance ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                `Mark ₱${
                  payment.total_amount
                    ? (
                        payment.total_amount -
                        payment.amount
                      ).toLocaleString()
                    : "0"
                } as Paid`
              )}
            </button>
            <button
              onClick={onClose}
              disabled={processingBalance}
              className="py-2 px-4 bg-muted-foreground text-white rounded-md text-sm font-medium hover:bg-muted-foreground/90 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment History Modal
// ---------------------------------------------------------------------------

interface PaymentHistoryModalProps {
  payment: Payment;
  getStatusColor: (status: string) => string;
  onClose: () => void;
}

export function PaymentHistoryModal({
  payment,
  getStatusColor,
  onClose,
}: PaymentHistoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full border border-border max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-muted p-6 rounded-t-lg border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Payment History
              </h2>
              <p className="text-muted-foreground text-sm">
                {payment.user} -{" "}
                {formatBookingNumber(payment.booking_id)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-card hover:shadow-md transition"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Summary Info */}
          <div className="bg-primary/10 p-4 rounded-lg border border-info/20 mb-6">
            <h3 className="text-sm font-semibold text-primary mb-3">
              Booking Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-foreground ml-2">
                  ₱{payment.total_amount?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Paid:</span>
                <span className="font-bold text-success ml-2">
                  ₱{payment.amount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Payment Type:</span>
                <span className="font-medium text-foreground ml-2">
                  {payment.payment_type === "half"
                    ? "50% Down Payment"
                    : "Full Payment"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Submissions:</span>
                <span className="font-medium text-foreground ml-2">
                  {payment.total_proofs}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Proofs Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              All Payment Proofs
            </h3>

            {payment.all_payment_proofs &&
            payment.all_payment_proofs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Sequence
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {payment.all_payment_proofs.map(
                      (proof) => (
                        <tr
                          key={`proof-${proof.id}`}
                          className="hover:bg-muted"
                        >
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
                              #{proof.sequence}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            ₱{proof.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {proof.reference_number ? (
                              <div
                                className={`font-mono px-2 py-1 rounded text-xs ${
                                  proof.reference_number.startsWith(
                                    "ARRIVAL-",
                                  )
                                    ? "text-warning bg-warning/10"
                                    : "text-primary bg-primary/10"
                                }`}
                              >
                                {proof.reference_number}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">
                                No reference
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground capitalize">
                            {proof.payment_method?.replace("_", " ")}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                proof.status,
                              )}`}
                            >
                              {proof.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(proof.uploaded_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {proof.admin_notes && (
                              <div
                                className="max-w-xs truncate"
                                title={proof.admin_notes}
                              >
                                {proof.admin_notes}
                              </div>
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">📝</div>
                <p>No payment proofs uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-muted p-4 rounded-b-lg border-t border-border">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted-foreground text-white rounded-md text-sm font-medium hover:bg-muted-foreground/90 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
