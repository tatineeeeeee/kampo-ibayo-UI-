"use client";
import Link from "next/link";

import type { BookingRow } from "../../lib/types/booking";

interface BookingHistoryProps {
  recentBookings: BookingRow[];
}

export default function BookingHistory({
  recentBookings,
}: BookingHistoryProps) {
  if (recentBookings.length === 0) {
    return null;
  }

  return (
    <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Recent Bookings
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Latest {recentBookings.length} booking
            {recentBookings.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/bookings"
          className="bg-primary/20 hover:bg-primary/30 text-primary hover:text-primary/80 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 border border-primary/30"
        >
          View All →
        </Link>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {recentBookings.map((booking) => {
          const checkInDate = new Date(booking.check_in_date);
          const checkOutDate = new Date(booking.check_out_date);
          const status = booking.status || "pending";
          const isUpcoming = checkInDate > new Date();
          const isActive =
            checkInDate <= new Date() && checkOutDate >= new Date();

          return (
            <div
              key={booking.id}
              className="bg-muted/30 border border-border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-all duration-200"
            >
              {/* Header with Guest Name and Status */}
              <div className="flex justify-between items-start mb-3 gap-3">
                <h4 className="text-foreground font-semibold text-sm sm:text-base truncate flex-1">
                  {booking.guest_name}
                </h4>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ${
                    status === "cancelled"
                      ? "bg-red-500/20 text-red-400"
                      : status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : status === "confirmed" &&
                        checkOutDate < new Date()
                      ? "bg-green-500/20 text-green-400"
                      : status === "confirmed" && isActive
                      ? "bg-primary/20 text-primary"
                      : status === "confirmed" && isUpcoming
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  {status === "cancelled"
                    ? "Cancelled"
                    : status === "pending"
                    ? "Pending"
                    : status === "confirmed" && checkOutDate < new Date()
                    ? "Completed"
                    : status === "confirmed" && isActive
                    ? "Active"
                    : status === "confirmed" && isUpcoming
                    ? "Confirmed"
                    : "Unknown"}
                </span>
              </div>

              {/* Date Range */}
              <div className="mb-3">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  📅{" "}
                  {checkInDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {checkOutDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Bottom Row */}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-1 sm:gap-2 text-xs">
                  <span className="bg-secondary/50 text-muted-foreground px-2 py-1 rounded flex items-center gap-1">
                    <span>👥</span>
                    <span className="hidden sm:inline">
                      {booking.number_of_guests} guest
                      {booking.number_of_guests > 1 ? "s" : ""}
                    </span>
                    <span className="sm:hidden">
                      {booking.number_of_guests}
                    </span>
                  </span>
                </div>
                <p className="text-foreground font-bold text-xs sm:text-sm">
                  ₱{booking.total_amount.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
