"use client";

import {
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { useReportData, ReportType } from "@/app/hooks/useReportData";
import { useReportFilters, usePaginatedBookings } from "@/app/hooks/useReportFilters";

import DailyOperationsReport from "../../components/admin/reports/DailyOperationsReport";
import UserDatabaseReport from "../../components/admin/reports/UserDatabaseReport";
import BookingStatusReport from "../../components/admin/reports/BookingStatusReport";
import BookingsTable from "../../components/admin/reports/BookingsTable";
import ReportFilters from "../../components/admin/reports/ReportFilters";
import ReportSelector from "../../components/admin/reports/ReportSelector";

export default function ReportsPage() {
  const filters = useReportFilters();

  const reportData = useReportData({
    statusFilter: filters.statusFilter,
    paymentStatusFilter: filters.paymentStatusFilter,
    paymentMethodFilter: filters.paymentMethodFilter,
    setCustomerPage: filters.setCustomerPage,
  });

  const { totalPages, startIndex, endIndex, currentBookings } =
    usePaginatedBookings(
      reportData.filteredBookings,
      filters.currentPage,
      filters.setCurrentPage,
      filters.itemsPerPage,
      reportData.startDate,
      reportData.endDate,
      filters.statusFilter,
    );

  const handleSelectReport = (report: ReportType) => {
    reportData.setSelectedReport(report);
    filters.resetFilters();
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    if (report.id === "booking-status") {
      // Booking Status defaults to current month
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const firstOfMonth = `${y}-${m}-01`;
      reportData.setStartDate(firstOfMonth);
      reportData.setEndDate(todayStr);
    } else {
      reportData.setStartDate(todayStr);
      reportData.setEndDate(todayStr);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Business Reports
            </h1>
            <p className="text-foreground mt-1 text-sm sm:text-base">
              Real-world reports for resort operations
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              📅 Filtering by check-in date (when guests will arrive)
            </p>
          </div>
          <button
            onClick={reportData.fetchBookings}
            disabled={reportData.isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 text-sm sm:text-base"
          >
            {reportData.isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh Data
          </button>
        </div>

        {/* Report Type Selection */}
        <ReportSelector
          selectedReport={reportData.selectedReport}
          onSelectReport={handleSelectReport}
        />

        {/* Contextual Filters Based on Report Type */}
        <ReportFilters
          selectedReportId={reportData.selectedReport.id}
          startDate={reportData.startDate}
          endDate={reportData.endDate}
          statusFilter={filters.statusFilter}
          paymentStatusFilter={filters.paymentStatusFilter}
          paymentMethodFilter={filters.paymentMethodFilter}
          isLoading={reportData.isLoading}
          isExporting={reportData.isExporting}
          bookings={reportData.bookings}
          selectedReportName={reportData.selectedReport.name}
          setStartDate={reportData.setStartDate}
          setEndDate={reportData.setEndDate}
          setStatusFilter={filters.setStatusFilter}
          setPaymentStatusFilter={filters.setPaymentStatusFilter}
          setPaymentMethodFilter={filters.setPaymentMethodFilter}
          exportReport={reportData.exportReport}
          showToast={reportData.showToast}
        />
      </div>

      {/* Dynamic Charts Based on Report Type */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-info" />
          {reportData.selectedReport.name} Analytics
        </h2>

        {/* Daily Operations Summary */}
        {reportData.selectedReport.id === "daily-operations" && (
          <DailyOperationsReport
            startDate={reportData.startDate}
            bookings={reportData.bookings}
            isLoading={reportData.isLoading}
          />
        )}

        {/* User Report Charts + Customer List */}
        {reportData.selectedReport.id === "user-database" && (
          <UserDatabaseReport
            filteredBookings={reportData.filteredBookings}
            allUsers={reportData.allUsers}
            isLoading={reportData.isLoading}
            customerPage={filters.customerPage}
            setCustomerPage={filters.setCustomerPage}
          />
        )}

        {/* Booking Status Charts */}
        {reportData.selectedReport.id === "booking-status" && (
          <BookingStatusReport
            filteredBookings={reportData.filteredBookings}
            statusFilter={filters.statusFilter}
            isLoading={reportData.isLoading}
            formatCurrency={reportData.formatCurrency}
          />
        )}
      </div>

      {/* Bookings Table - Only for Daily Operations and Booking Status */}
      {reportData.selectedReport.id !== "user-database" && (
        <BookingsTable
          bookings={reportData.bookings}
          currentBookings={currentBookings}
          isLoading={reportData.isLoading}
          currentPage={filters.currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          setCurrentPage={filters.setCurrentPage}
          formatCurrency={reportData.formatCurrency}
        />
      )}
    </div>
  );
}
