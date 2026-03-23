"use client";

import PaymentFilters from "../../components/admin/payments/PaymentFilters";
import PaymentTable from "../../components/admin/payments/PaymentTable";
import {
  BalancePaymentModal,
  PaymentHistoryModal,
} from "../../components/admin/payments/PaymentDetailModal";
import { usePaymentManagement } from "../../hooks/usePaymentManagement";

export default function PaymentsPage() {
  const {
    payments,
    filteredPayments,
    paginatedPayments,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
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
    showBalanceModal,
    setShowBalanceModal,
    selectedPayment,
    setSelectedPayment,
    processingBalance,
    markBalanceAsPaid,
    canMarkBalanceAsPaid,
    showPaymentHistoryModal,
    setShowPaymentHistoryModal,
    selectedPaymentHistory,
    setSelectedPaymentHistory,
    getStatusColor,
    success,
    showError,
  } = usePaymentManagement();

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Payments</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading payments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Payments</h3>
        <div className="text-destructive text-center py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <PaymentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        payments={payments}
        filteredPayments={filteredPayments}
      />

      {/* Payments Table */}
      <PaymentTable
        paginatedPayments={paginatedPayments}
        filteredPayments={filteredPayments}
        payments={payments}
        searchTerm={searchTerm}
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
        canMarkBalanceAsPaid={canMarkBalanceAsPaid}
        onMarkBalancePaid={(payment) => {
          setSelectedPayment(payment);
          setShowBalanceModal(true);
        }}
        onExportSuccess={success}
        onExportError={showError}
      />

      {/* Balance Payment Confirmation Modal */}
      {showBalanceModal && selectedPayment && (
        <BalancePaymentModal
          payment={selectedPayment}
          processingBalance={processingBalance}
          onConfirm={markBalanceAsPaid}
          onClose={() => {
            setShowBalanceModal(false);
            setSelectedPayment(null);
          }}
        />
      )}

      {/* Payment History Modal */}
      {showPaymentHistoryModal && selectedPaymentHistory && (
        <PaymentHistoryModal
          payment={selectedPaymentHistory}
          getStatusColor={getStatusColor}
          onClose={() => {
            setShowPaymentHistoryModal(false);
            setSelectedPaymentHistory(null);
          }}
        />
      )}
    </div>
  );
}
