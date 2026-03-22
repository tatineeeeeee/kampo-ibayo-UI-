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
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap font-medium text-sm shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Walk-in Booking</span>
            <span className="sm:hidden">Walk-in</span>
          </Link>
        </div>
        {searchTerm && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
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
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
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
        <h3 className="text-base sm:text-lg font-semibold text-gray-700">
          All Bookings ({filteredBookings.length})
          {!showDeletedUsers && bookings.length > filteredBookings.length && (
            <span className="text-sm text-gray-500 ml-2">
              ({bookings.length - filteredBookings.length} hidden from deleted
              users)
            </span>
          )}
          {searchTerm && (
            <span className="text-sm text-blue-600 ml-2">(filtered)</span>
          )}
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="flex items-center text-xs sm:text-sm text-black">
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
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
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
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
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
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
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
