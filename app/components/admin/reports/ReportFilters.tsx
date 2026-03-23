"use client";

import {
  Download,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Tables } from "@/database.types";
import { Toast } from "@/app/components/Toast";
import { exportReportsPDF } from "@/app/utils/pdfExport";

type BookingRow = Tables<"bookings">;

interface ReportFiltersProps {
  selectedReportId: string;
  startDate: string;
  endDate: string;
  statusFilter: string;
  paymentStatusFilter: string;
  paymentMethodFilter: string;
  isLoading: boolean;
  isExporting: boolean;
  bookings: BookingRow[];
  selectedReportName: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setStatusFilter: (filter: string) => void;
  setPaymentStatusFilter: (filter: string) => void;
  setPaymentMethodFilter: (filter: string) => void;
  exportReport: () => void;
  showToast: (toast: Omit<Toast, "id">) => void;
}

export default function ReportFilters({
  selectedReportId,
  startDate,
  endDate,
  statusFilter,
  paymentStatusFilter,
  paymentMethodFilter,
  isLoading,
  isExporting,
  bookings,
  selectedReportName,
  setStartDate,
  setEndDate,
  setStatusFilter,
  setPaymentStatusFilter,
  setPaymentMethodFilter,
  exportReport,
  showToast,
}: ReportFiltersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Daily Operations: Single date picker for the operations date */}
      {selectedReportId === "daily-operations" && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Operations Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setEndDate(e.target.value);
            }}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
          />
        </div>
      )}

      {/* User Report: No date filter — fetches all customers */}

      {/* Booking Status: Full filter suite (dates, status, payment) */}
      {selectedReportId === "booking-status" && (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Check-in Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Check-in End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Booking Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
            >
              <option value="all">Active Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
            >
              <option value="all">All Payment Status</option>
              <option value="verified">Verified</option>
              <option value="paid">Paid</option>
              <option value="payment_review">Under Review</option>
              <option value="pending">Pending Payment</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Payment Type
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
            >
              <option value="all">All Payment Types</option>
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
            </select>
          </div>
        </>
      )}

      {/* Export buttons - always visible */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Export
        </label>
        <div className="flex gap-2">
          <button
            onClick={exportReport}
            disabled={isLoading || bookings.length === 0 || isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to CSV"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            CSV
          </button>
          <button
            onClick={async () => {
              try {
                await exportReportsPDF(
                  bookings as unknown as {
                    [key: string]:
                      | string
                      | number
                      | boolean
                      | null
                      | undefined
                      | object;
                  }[],
                  selectedReportName,
                  { start: startDate, end: endDate },
                );
                showToast({
                  type: "success",
                  title: "PDF Export Completed",
                  message: `${selectedReportName} exported to PDF successfully!`,
                });
              } catch (error) {
                console.error("PDF export error:", error);
                showToast({
                  type: "error",
                  title: "Export Failed",
                  message: "Failed to export PDF. Please try again.",
                });
              }
            }}
            disabled={isLoading || bookings.length === 0 || isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to PDF"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
}
