"use client";

import Link from "next/link";
import {
  Download,
  FileText,
  UserPlus,
  Footprints,
} from "lucide-react";
import { exportBookingsCSV } from "../../../utils/csvExport";
import { exportBookingsPDF } from "../../../utils/pdfExport";
import type { Booking } from "../../../lib/types";

interface BookingFiltersProps {
  searchTerm: string;
  statusFilter: string;
  showDeletedUsers: boolean;
  bookings: Booking[];
  filteredBookings: Booking[];
  refreshing: boolean;
  onSearchTermChange: (term: string) => void;
  onStatusFilterChange: (filter: string) => void;
  onShowDeletedUsersChange: (show: boolean) => void;
  onRefresh: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function BookingFilters({
  searchTerm,
  statusFilter,
  showDeletedUsers,
  bookings,
  filteredBookings,
  refreshing,
  onSearchTermChange,
  onStatusFilterChange,
  onShowDeletedUsersChange,
  onRefresh,
  onSuccess,
  onError,
}: BookingFiltersProps) {
  return (
    <>
      {/* Search Bar + Walk-in Button */}
      <div className="mb-3 sm:mb-4">
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by booking number (KB-0001), guest name, email, phone, or ID..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <Link
            href="/admin/bookings/walk-in"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap font-medium text-sm shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Walk-in Booking</span>
            <span className="sm:hidden">Walk-in</span>
          </Link>
        </div>
        {searchTerm && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Found {filteredBookings.length} booking
            {filteredBookings.length !== 1 ? "s" : ""} matching &quot;
            {searchTerm}&quot;
          </p>
        )}
      </div>

      {/* Status Filter Buttons */}
      <div className="mb-3 sm:mb-4">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => onStatusFilterChange("all")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-info/10 text-info border border-info/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">All</span>
            <span className="hidden sm:inline">All</span>
            <span className="ml-1">({bookings.length})</span>
          </button>
          <button
            onClick={() => onStatusFilterChange("pending")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "pending"
                ? "bg-warning/10 text-warning border border-warning/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">Pend</span>
            <span className="hidden sm:inline">Pending</span>
            <span className="ml-1">
              (
              {
                bookings.filter((b) => b.status?.toLowerCase() === "pending")
                  .length
              }
              )
            </span>
          </button>
          <button
            onClick={() => onStatusFilterChange("confirmed")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "confirmed"
                ? "bg-success/10 text-success border border-success/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">Conf</span>
            <span className="hidden sm:inline">Confirmed</span>
            <span className="ml-1">
              (
              {
                bookings.filter(
                  (b) => b.status?.toLowerCase() === "confirmed",
                ).length
              }
              )
            </span>
          </button>
          <button
            onClick={() => onStatusFilterChange("completed")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "completed"
                ? "bg-chart-4/10 text-chart-4 border border-chart-4/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">Done</span>
            <span className="hidden sm:inline">Completed</span>
            <span className="ml-1">
              (
              {
                bookings.filter(
                  (b) => b.status?.toLowerCase() === "completed",
                ).length
              }
              )
            </span>
          </button>
          <button
            onClick={() => onStatusFilterChange("cancelled")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "cancelled"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">Canc</span>
            <span className="hidden sm:inline">Cancelled</span>
            <span className="ml-1">
              (
              {
                bookings.filter(
                  (b) => b.status?.toLowerCase() === "cancelled",
                ).length
              }
              )
            </span>
          </button>
          <button
            onClick={() => onStatusFilterChange("walk-in")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
              statusFilter === "walk-in"
                ? "bg-warning/10 text-warning border border-warning/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span className="sm:hidden">Walk</span>
            <span className="hidden sm:inline">Walk-in</span>
            <span className="ml-1">
              (
              {
                bookings.filter((b) =>
                  String(b.special_requests || "").startsWith("[WALK-IN]"),
                ).length
              }
              )
            </span>
          </button>
        </div>
        {(statusFilter !== "all" || searchTerm) && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Showing {filteredBookings.length} of {bookings.length} bookings
            {statusFilter === "walk-in" && " (walk-in bookings)"}
            {statusFilter !== "all" &&
              statusFilter !== "walk-in" &&
              ` with status "${statusFilter}"`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          All Bookings ({filteredBookings.length})
          {!showDeletedUsers && bookings.length > filteredBookings.length && (
            <span className="text-sm text-muted-foreground ml-2">
              ({bookings.length - filteredBookings.length} hidden from deleted
              users)
            </span>
          )}
          {searchTerm && (
            <span className="text-sm text-primary ml-2">(filtered)</span>
          )}
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="flex items-center text-xs sm:text-sm text-foreground">
            <input
              type="checkbox"
              checked={showDeletedUsers}
              onChange={(e) => onShowDeletedUsersChange(e.target.checked)}
              className="mr-2"
            />
            Show deleted user bookings
          </label>

          {/* Export CSV Button */}
          <button
            onClick={() => {
              try {
                exportBookingsCSV(
                  filteredBookings as unknown as {
                    [key: string]:
                      | string
                      | number
                      | boolean
                      | null
                      | undefined
                      | object;
                  }[],
                );
                onSuccess("Bookings exported to CSV successfully!");
              } catch (error) {
                console.error("Export error:", error);
                onError("Failed to export CSV");
              }
            }}
            disabled={filteredBookings.length === 0}
            className={`px-3 py-1 text-white rounded-md text-sm transition flex items-center gap-2 ${
              filteredBookings.length === 0
                ? "bg-muted-foreground cursor-not-allowed"
                : "bg-success hover:bg-success/90"
            }`}
            title="Export current bookings to CSV"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>

          {/* Export PDF Button */}
          <button
            onClick={async () => {
              try {
                await exportBookingsPDF(
                  filteredBookings as unknown as {
                    [key: string]:
                      | string
                      | number
                      | boolean
                      | null
                      | undefined
                      | object;
                  }[],
                );
                onSuccess("Bookings exported to PDF successfully!");
              } catch (error) {
                console.error("Export error:", error);
                onError("Failed to export PDF");
              }
            }}
            disabled={filteredBookings.length === 0}
            className={`px-3 py-1 text-white rounded-md text-sm transition flex items-center gap-2 ${
              filteredBookings.length === 0
                ? "bg-muted-foreground cursor-not-allowed"
                : "bg-destructive hover:bg-destructive/90"
            }`}
            title="Export current bookings to PDF"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className={`px-3 py-1 text-white rounded-md text-sm transition ${
              refreshing
                ? "bg-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {refreshing ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                Refreshing...
              </span>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
