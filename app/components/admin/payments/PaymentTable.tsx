"use client";

import {
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Footprints,
} from "lucide-react";
import { exportPaymentsCSV } from "../../../utils/csvExport";
import { exportPaymentsPDF } from "../../../utils/pdfExport";
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

interface PaymentTableProps {
  paginatedPayments: Payment[];
  filteredPayments: Payment[];
  payments: Payment[];
  searchTerm: string;
  // Pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  setItemsPerPage: (n: number) => void;
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  // Actions
  canMarkBalanceAsPaid: (payment: Payment) => boolean;
  onMarkBalancePaid: (payment: Payment) => void;
  onExportSuccess: (message: string) => void;
  onExportError: (message: string) => void;
}

export default function PaymentTable({
  paginatedPayments,
  filteredPayments,
  payments,
  searchTerm,
  currentPage,
  totalPages,
  itemsPerPage,
  startIndex,
  setItemsPerPage,
  goToPage,
  goToFirstPage,
  goToLastPage,
  goToPreviousPage,
  goToNextPage,
  canMarkBalanceAsPaid,
  onMarkBalancePaid,
  onExportSuccess,
  onExportError,
}: PaymentTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Payment Transactions ({filteredPayments.length}
            {searchTerm ? ` filtered` : ` total`})
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 sm:space-x-2">
            {/* Export CSV Button */}
            <button
              onClick={() => {
                try {
                  exportPaymentsCSV(
                    filteredPayments as unknown as {
                      [key: string]:
                        | string
                        | number
                        | boolean
                        | null
                        | undefined
                        | object;
                    }[],
                  );
                  onExportSuccess(
                    `${filteredPayments.length} payment${
                      filteredPayments.length !== 1 ? "s" : ""
                    } exported to CSV successfully!`,
                  );
                } catch (error) {
                  console.error("Export error:", error);
                  onExportError("Failed to export CSV. Please try again.");
                }
              }}
              disabled={filteredPayments.length === 0}
              className={`inline-flex items-center px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm font-medium transition-colors ${
                filteredPayments.length === 0
                  ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
              }`}
              title="Export payments to CSV"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </button>

            {/* Export PDF Button */}
            <button
              onClick={async () => {
                try {
                  await exportPaymentsPDF(
                    filteredPayments as unknown as {
                      [key: string]:
                        | string
                        | number
                        | boolean
                        | null
                        | undefined
                        | object;
                    }[],
                  );
                  onExportSuccess(
                    `${filteredPayments.length} payment${
                      filteredPayments.length !== 1 ? "s" : ""
                    } exported to PDF successfully!`,
                  );
                } catch (error) {
                  console.error("Export error:", error);
                  onExportError("Failed to export PDF. Please try again.");
                }
              }}
              disabled={filteredPayments.length === 0}
              className={`inline-flex items-center px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm font-medium transition-colors ${
                filteredPayments.length === 0
                  ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100"
              }`}
              title="Export payments to PDF"
            >
              <FileText className="w-4 h-4 mr-1" />
              PDF
            </button>

          </div>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">💳</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            {searchTerm
              ? `No payments match "${searchTerm}"`
              : "No payments found"}
          </h3>
          <p className="text-gray-500 text-sm">
            {searchTerm
              ? "Try adjusting your search terms or clear the search to see all payments."
              : "Payment transactions will appear here once guests make bookings."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden divide-y divide-gray-200">
            {paginatedPayments.map((payment) => (
              <div
                key={`mobile-${payment.booking_id}`}
                className="p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {payment.guest_name || payment.user}
                    </p>
                    <p className="text-xs text-gray-500">{payment.email}</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-400">
                        {formatBookingNumber(payment.booking_id)}
                      </p>
                      {payment.is_walk_in && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                          <Footprints className="w-2.5 h-2.5" />
                          Walk-in
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">
                      ₱{(payment.amount || 0).toLocaleString()}
                    </span>
                    {payment.total_amount && payment.amount < payment.total_amount && payment.amount > 0 && (
                      <div className="text-[10px]">
                        <span className="text-amber-600 font-medium">₱{(payment.total_amount - payment.amount).toLocaleString()}</span>
                        <span className="text-gray-400"> due</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        payment.payment_type === "half"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {payment.payment_type === "half" ? "50% Down" : "Full"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        payment.booking_status?.toLowerCase() === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : payment.original_status === "verified"
                            ? "bg-green-100 text-green-800"
                            : payment.original_status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {payment.booking_status?.toLowerCase() === "cancelled"
                        ? "cancelled"
                        : payment.original_status || "pending"}
                    </span>
                  </div>
                </div>
                {payment.original_reference && (
                  <p className="text-xs text-gray-600 mb-1">
                    <span className="text-gray-500">Ref:</span>{" "}
                    <span className="font-mono">
                      {payment.original_reference}
                    </span>
                  </p>
                )}
                {canMarkBalanceAsPaid(payment) && (
                  <button
                    onClick={() => onMarkBalancePaid(payment)}
                    className="w-full mt-2 px-3 py-2 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md text-xs font-medium"
                  >
                    Mark Balance Paid
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Original Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Balance Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPayments.map((payment) => (
                  <tr
                    key={`booking-${payment.booking_id}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.guest_name || payment.user}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">
                            {formatBookingNumber(payment.booking_id)}
                          </span>
                          {payment.is_walk_in && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                              <Footprints className="w-2.5 h-2.5" />
                              Walk-in
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">
                        ₱{(payment.amount || 0).toLocaleString()}
                      </span>
                      {payment.total_amount && payment.amount < payment.total_amount && payment.amount > 0 && (
                        <div className="text-xs mt-0.5">
                          <span className="text-amber-600 font-medium">₱{(payment.total_amount - payment.amount).toLocaleString()}</span>
                          <span className="text-gray-400"> due</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {(() => {
                          // Check if this is a balance payment first
                          if (
                            payment.reference_number?.startsWith("ARRIVAL-")
                          ) {
                            return (
                              <div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Balance Payment (50%)
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  Cash on arrival
                                </div>
                              </div>
                            );
                          }

                          // Smart payment type detection for original payments
                          const paymentType = payment.payment_type;
                          const amount = payment.amount;
                          const totalAmount = payment.total_amount;

                          // If payment_type is explicitly set, use it
                          if (paymentType === "half") {
                            return (
                              <div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  50% Down Payment
                                </span>
                                {totalAmount && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Total: ₱{totalAmount.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            );
                          } else if (paymentType === "full") {
                            const paidAmt = amount || 0;
                            const bookingTotal = totalAmount || 0;
                            if (bookingTotal > 0 && paidAmt < bookingTotal && paidAmt > 0) {
                              return (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Rescheduled
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Full Payment
                              </span>
                            );
                          }

                          // Try to infer from amounts if payment_type is missing
                          if (totalAmount && amount) {
                            const percentage = (amount / totalAmount) * 100;
                            if (percentage >= 45 && percentage <= 55) {
                              return (
                                <div>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    50% Down Payment (inferred)
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Total: ₱{totalAmount.toLocaleString()}
                                  </div>
                                </div>
                              );
                            } else if (percentage >= 95) {
                              return (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Full Payment (100%)
                                </span>
                              );
                            }
                          }

                          // Fallback for unknown cases
                          return (
                            <div>
                              <span className="text-gray-400 italic text-xs">
                                Type not specified
                              </span>
                              {totalAmount && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Total: ₱{totalAmount.toLocaleString()}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {payment.original_reference ? (
                          <div className="font-mono text-gray-700 bg-blue-50 px-2 py-1 rounded text-xs">
                            {payment.original_reference}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            No reference provided
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {payment.balance_reference ? (
                          <div className="font-mono text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs">
                            {payment.balance_reference}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            Not specified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.booking_status?.toLowerCase() === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : payment.is_walk_in && (payment.booking_status === "confirmed" || payment.booking_status === "completed")
                              ? "bg-green-100 text-green-800"
                              : payment.original_status === "verified" &&
                                  (payment.payment_type === "full" ||
                                    payment.balance_status === "verified")
                                ? "bg-green-100 text-green-800"
                                : payment.original_status === "verified" &&
                                    payment.payment_type === "half"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : payment.original_status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {payment.booking_status?.toLowerCase() === "cancelled"
                          ? "cancelled"
                          : payment.is_walk_in && (payment.booking_status === "confirmed" || payment.booking_status === "completed")
                            ? "paid (cash)"
                            : payment.payment_type === "full" &&
                                payment.original_status === "verified"
                              ? "paid"
                              : payment.payment_type === "half" &&
                                  payment.original_status === "verified" &&
                                  payment.balance_status === "verified"
                                ? "paid"
                                : payment.payment_type === "half" &&
                                    payment.original_status === "verified"
                                  ? "partially_paid"
                                  : payment.original_status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        // Check if booking is cancelled first
                        if (
                          payment.booking_status?.toLowerCase() ===
                          "cancelled"
                        ) {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              BOOKING CANCELLED
                            </span>
                          );
                        }

                        const amount = payment.amount;
                        const totalAmount = payment.total_amount;
                        const isOverpaid =
                          totalAmount && amount > totalAmount;

                        // Check if this is a balance payment
                        if (
                          payment.reference_number?.startsWith("ARRIVAL-")
                        ) {
                          return (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                BALANCE PAID
                              </span>
                              <span className="text-xs text-gray-500">
                                Cash on arrival
                              </span>
                            </div>
                          );
                        }

                        if (canMarkBalanceAsPaid(payment)) {
                          return (
                            <button
                              onClick={() => onMarkBalancePaid(payment)}
                              className="inline-flex items-center px-3 py-1 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md text-xs font-medium transition-colors shadow-sm"
                              title="Mark remaining 50% balance as paid on arrival"
                            >
                              Mark Balance Paid
                            </button>
                          );
                        }

                        // Check if balance payment already exists for this booking
                        const hasBalancePayment = payments.some(
                          (p) =>
                            p.booking_id === payment.booking_id &&
                            p.reference_number?.startsWith("ARRIVAL-"),
                        );

                        if (
                          payment.payment_type === "half" &&
                          hasBalancePayment
                        ) {
                          return (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                FULLY PAID
                              </span>
                              <span className="text-xs text-gray-500">
                                50% + Balance
                              </span>
                            </div>
                          );
                        }

                        if (payment.payment_type === "half" && isOverpaid) {
                          return (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                OVERPAID
                              </span>
                            </div>
                          );
                        }

                        if (payment.payment_type === "half") {
                          const balanceAmount = totalAmount
                            ? totalAmount - amount
                            : 0;
                          if (balanceAmount <= 0) {
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                PAID IN FULL
                              </span>
                            );
                          } else {
                            return (
                              <span className="text-xs text-gray-400">
                                Balance: ₱{balanceAmount.toLocaleString()}
                              </span>
                            );
                          }
                        }

                        return (
                          <span className="text-xs text-gray-400">-</span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredPayments.length > 0 && (
            <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4 bg-gray-50 px-3 sm:px-4 py-3 rounded-lg">
              {/* Mobile: Simple pagination */}
              <div className="flex sm:hidden justify-between items-center">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded border border-gray-300 bg-white disabled:opacity-50 text-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded border border-gray-300 bg-white disabled:opacity-50 text-sm"
                >
                  Next
                </button>
              </div>

              {/* Desktop: Full pagination */}
              <div className="hidden sm:flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Items per page and info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="itemsPerPage"
                      className="text-sm text-gray-800 font-medium"
                    >
                      Show:
                    </label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) =>
                        setItemsPerPage(Number(e.target.value))
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 font-medium bg-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <span className="text-sm text-gray-800 font-medium">
                    Showing{" "}
                    {Math.min(startIndex + 1, filteredPayments.length)} to{" "}
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredPayments.length,
                    )}{" "}
                    of {filteredPayments.length} payments
                  </span>
                </div>

                {/* Page info and controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800 font-medium mr-4">
                      Page {currentPage} of {totalPages}
                    </span>

                    {/* Navigation buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </button>

                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {/* Page numbers */}
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNumber}
                              onClick={() => goToPage(pageNumber)}
                              className={`px-3 py-2 text-sm font-medium rounded border ${
                                currentPage === pageNumber
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        },
                      )}

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>

                      <button
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
