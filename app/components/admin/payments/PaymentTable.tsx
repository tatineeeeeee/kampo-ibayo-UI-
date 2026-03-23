"use client";

import {
  Download,
  FileText,
} from "lucide-react";
import { exportPaymentsCSV } from "../../../utils/csvExport";
import { exportPaymentsPDF } from "../../../utils/pdfExport";
import PaymentTableRow from "./PaymentTableRow";
import PaymentTablePagination from "./PaymentTablePagination";

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
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
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
                  ? "border-border text-muted-foreground bg-muted cursor-not-allowed"
                  : "border-success/20 text-success bg-success/10 hover:bg-success/10"
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
                  ? "border-border text-muted-foreground bg-muted cursor-not-allowed"
                  : "border-info/20 text-primary bg-primary/10 hover:bg-info/10"
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
          <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
            {searchTerm
              ? `No payments match "${searchTerm}"`
              : "No payments found"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {searchTerm
              ? "Try adjusting your search terms or clear the search to see all payments."
              : "Payment transactions will appear here once guests make bookings."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden divide-y divide-border">
            {paginatedPayments.map((payment) => (
              <PaymentTableRow
                key={`mobile-${payment.booking_id}`}
                payment={payment}
                payments={payments}
                variant="mobile"
                canMarkBalanceAsPaid={canMarkBalanceAsPaid}
                onMarkBalancePaid={onMarkBalancePaid}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Original Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Balance Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {paginatedPayments.map((payment) => (
                  <PaymentTableRow
                    key={`desktop-${payment.booking_id}`}
                    payment={payment}
                    payments={payments}
                    variant="desktop"
                    canMarkBalanceAsPaid={canMarkBalanceAsPaid}
                    onMarkBalancePaid={onMarkBalancePaid}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <PaymentTablePagination
            filteredCount={filteredPayments.length}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            startIndex={startIndex}
            setItemsPerPage={setItemsPerPage}
            goToPage={goToPage}
            goToFirstPage={goToFirstPage}
            goToLastPage={goToLastPage}
            goToPreviousPage={goToPreviousPage}
            goToNextPage={goToNextPage}
          />
        </>
      )}
    </div>
  );
}
