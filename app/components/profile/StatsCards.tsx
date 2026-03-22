"use client";
import {
  FaCalendarAlt,
  FaClock,
  FaChartLine,
  FaStar,
} from "react-icons/fa";

interface BookingStats {
  totalBookings: number;
  totalNights: number;
  totalSpent: number;
  loyaltyStatus: string;
  upcomingBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

interface StatsCardsProps {
  bookingStats: BookingStats;
  statsLoading: boolean;
}

export default function StatsCards({
  bookingStats,
  statsLoading,
}: StatsCardsProps) {
  return (
    <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full"></span>
          Account Overview
        </h3>
        {statsLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        )}
      </div>

      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          📊 Stats based on admin-confirmed completed stays only. Pending
          bookings await admin approval.
        </p>
      </div>

      {/* Stats Grid - Mobile First: 2 cols, Desktop: 4 cols */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-border">
          <FaCalendarAlt className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {bookingStats.totalBookings}
          </div>
          <div className="text-xs text-muted-foreground">Resort Bookings</div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-border">
          <FaClock className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {bookingStats.totalNights}
          </div>
          <div className="text-xs text-muted-foreground">Days at Resort</div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-border">
          <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-lg sm:text-2xl font-bold text-foreground">
            ₱{bookingStats.totalSpent.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">Total Spent</div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-border">
          <FaStar className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mx-auto mb-2" />
          <div
            className={`text-lg sm:text-2xl font-bold ${
              bookingStats.loyaltyStatus === "Elite"
                ? "text-yellow-500"
                : bookingStats.loyaltyStatus === "VIP"
                ? "text-purple-500"
                : bookingStats.loyaltyStatus === "Regular"
                ? "text-blue-500"
                : "text-green-500"
            }`}
          >
            {bookingStats.loyaltyStatus}
          </div>
          <div className="text-xs text-muted-foreground">Resort Status</div>
        </div>
      </div>

      {/* Status Alerts */}
      <div className="space-y-3 mb-6">
        {bookingStats.upcomingBookings > 0 && (
          <div className="p-3 bg-primary/20 border border-primary/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-primary text-sm">
                Confirmed Upcoming
              </span>
              <span className="text-primary/80 font-semibold">
                {bookingStats.upcomingBookings}
              </span>
            </div>
          </div>
        )}

        {bookingStats.pendingBookings > 0 && (
          <div className="p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-yellow-400 text-sm">
                Awaiting Admin Approval
              </span>
              <span className="text-yellow-300 font-semibold">
                {bookingStats.pendingBookings}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Breakdown section */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-muted-foreground mb-4">
          Booking Status Breakdown
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
            <span className="text-green-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full flex-shrink-0"></div>
              <span className="truncate">Completed</span>
            </span>
            <span className="text-green-400 font-semibold">
              {bookingStats.completedBookings}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
            <span className="text-primary text-sm flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary/70 rounded-full flex-shrink-0"></div>
              <span className="truncate">Upcoming</span>
            </span>
            <span className="text-primary font-semibold">
              {bookingStats.upcomingBookings}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
            <span className="text-yellow-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
              <span className="truncate">Pending</span>
            </span>
            <span className="text-yellow-400 font-semibold">
              {bookingStats.pendingBookings}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
            <span className="text-red-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full flex-shrink-0"></div>
              <span className="truncate">Cancelled</span>
            </span>
            <span className="text-red-400 font-semibold">
              {bookingStats.cancelledBookings}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
