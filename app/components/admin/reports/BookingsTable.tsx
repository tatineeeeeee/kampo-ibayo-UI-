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
    <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-700">
          Booking Results
        </h3>
        <span className="text-xs sm:text-sm text-gray-700">
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}{" "}
          found
          {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-700">Loading bookings...</span>
        </div>
      ) : bookings.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {currentBookings.map((booking) => (
              <div
                key={`mobile-${booking.id}`}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      {booking.guest_name}
                    </h4>
                    <p className="text-xs text-gray-600 truncate max-w-[180px]">
                      {booking.guest_email || "No email"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {booking.status || "Unknown"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Check-in</p>
                    <p className="text-gray-900">
                      {new Date(booking.check_in_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Check-out</p>
                    <p className="text-gray-900">
                      {new Date(booking.check_out_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="text-gray-900 font-medium">
                      {formatCurrency(booking.total_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Booked</p>
                    <p className="text-gray-900">
                      {booking.created_at
                        ? new Date(booking.created_at).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
                {booking.status === "cancelled" && booking.cancelled_by && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Cancelled by:{" "}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        booking.cancelled_by === "user"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-purple-100 text-purple-800"
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Check In
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Check Out
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Cancelled By
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Booked
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {booking.guest_name}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {booking.guest_email || "No email"}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(booking.check_in_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(booking.check_out_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatCurrency(booking.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {booking.status === "cancelled" &&
                      booking.cancelled_by ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.cancelled_by === "user"
                              ? "bg-orange-100 text-orange-800"
                              : booking.cancelled_by === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {booking.cancelled_by === "user"
                            ? "Guest"
                            : booking.cancelled_by === "admin"
                              ? "Admin"
                              : booking.cancelled_by}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
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
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 gap-3">
                <div className="text-xs sm:text-sm text-gray-900 font-medium">
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
                    className="px-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-700">
                    Page {currentPage}/{totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              ? "bg-green-600 text-white"
                              : "border border-gray-300 text-gray-900 hover:bg-gray-50"
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
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="text-center py-12 text-gray-700">
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
