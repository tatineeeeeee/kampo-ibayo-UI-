"use client";

import {
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tables } from "@/database.types";

type BookingRow = Tables<"bookings">;

interface BookingsTableProps {
  bookings: BookingRow[];
  currentBookings: BookingRow[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  formatCurrency: (amount: number) => string;
}

export default function BookingsTable({
  bookings,
  currentBookings,
  isLoading,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  setCurrentPage,
  formatCurrency,
}: BookingsTableProps) {
  return (
    <div className="bg-card rounded-xl shadow-md p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          Booking Results
        </h3>
        <span className="text-xs sm:text-sm text-foreground">
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}{" "}
          found
          {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-foreground">Loading bookings...</span>
        </div>
      ) : bookings.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {currentBookings.map((booking) => (
              <div
                key={`mobile-${booking.id}`}
                className="bg-muted border border-border rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-foreground text-sm">
                      {booking.guest_name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {booking.guest_email || "No email"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      booking.status === "confirmed"
                        ? "bg-success/10 text-success"
                        : booking.status === "pending"
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {booking.status || "Unknown"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Check-in</p>
                    <p className="text-foreground">
                      {new Date(booking.check_in_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Check-out</p>
                    <p className="text-foreground">
                      {new Date(booking.check_out_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="text-foreground font-medium">
                      {formatCurrency(booking.total_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Booked</p>
                    <p className="text-foreground">
                      {booking.created_at
                        ? new Date(booking.created_at).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
                {booking.status === "cancelled" && booking.cancelled_by && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Cancelled by:{" "}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        booking.cancelled_by === "user"
                          ? "bg-warning/10 text-warning"
                          : "bg-chart-4/10 text-chart-4"
                      }`}
                    >
                      {booking.cancelled_by === "user" ? "Guest" : "Admin"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Check In
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Check Out
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Cancelled By
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Booked
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {booking.guest_name}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {booking.guest_email || "No email"}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {new Date(booking.check_in_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {new Date(booking.check_out_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatCurrency(booking.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === "confirmed"
                            ? "bg-success/10 text-success"
                            : booking.status === "pending"
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {booking.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {booking.status === "cancelled" &&
                      booking.cancelled_by ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.cancelled_by === "user"
                              ? "bg-warning/10 text-warning"
                              : booking.cancelled_by === "admin"
                                ? "bg-chart-4/10 text-chart-4"
                                : "bg-muted text-foreground"
                          }`}
                        >
                          {booking.cancelled_by === "user"
                            ? "Guest"
                            : booking.cancelled_by === "admin"
                              ? "Admin"
                              : booking.cancelled_by}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {booking.created_at
                        ? new Date(booking.created_at).toLocaleDateString()
                        : "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-border gap-3">
                <div className="text-xs sm:text-sm text-foreground font-medium">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, bookings.length)} of {bookings.length}{" "}
                  bookings
                </div>

                {/* Mobile Pagination */}
                <div className="flex sm:hidden w-full justify-between items-center">
                  <button
                    onClick={() =>
                      setCurrentPage((prev: number) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-xs text-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-foreground">
                    Page {currentPage}/{totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-xs text-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>

                {/* Desktop Pagination */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev: number) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm rounded-lg font-medium ${
                            currentPage === page
                              ? "bg-primary text-primary-foreground"
                              : "border border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-60" />
          <p>No bookings found for the selected filters</p>
          <p className="text-sm mt-1">
            Try adjusting your date range or status filter
          </p>
        </div>
      )}
    </div>
  );
}
