"use client";

import {
  CheckCircle,
  XCircle,
  HourglassIcon,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import type { BookingStats } from "../../utils/bookingUtils";

interface BookingStatsPanelProps {
  bookingStats: BookingStats;
}

export function BookingStatsPanel({ bookingStats }: BookingStatsPanelProps) {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="bg-card rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
        <h2 className="text-sm sm:text-base lg:text-lg font-bold text-foreground mb-3 sm:mb-4">
          Booking Summary
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          <div className="bg-warning/20 border border-warning/20 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <HourglassIcon className="w-3 h-3 sm:w-4 sm:h-4 text-warning flex-shrink-0" />
              <span className="text-warning font-medium text-xs sm:text-sm">Pending</span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              {bookingStats.pendingCount}/3
            </p>
            <p className="text-xs text-warning truncate">
              {bookingStats.canCreatePending
                ? `${3 - bookingStats.pendingCount} slots left`
                : "Limit reached"}
            </p>
          </div>

          <div className="bg-success/20 border border-success/20 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-success flex-shrink-0" />
              <span className="text-success font-medium text-xs sm:text-sm">Confirmed</span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              {bookingStats.confirmedCount}
            </p>
            <p className="text-xs text-success">Active bookings</p>
          </div>

          <div className="bg-primary/20 border border-primary/50 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              <span className="text-primary font-medium text-xs sm:text-sm">Completed</span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              {bookingStats.completedCount}/5
            </p>
            <p className="text-xs text-primary/80 truncate">
              {bookingStats.completedCount >= 5 ? "Auto-archived" : "Recent ones"}
            </p>
          </div>

          <div className="bg-destructive/20 border border-destructive/20 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-destructive flex-shrink-0" />
              <span className="text-destructive font-medium text-xs sm:text-sm">Cancelled</span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              {bookingStats.cancelledCount}
            </p>
            <p className="text-xs text-destructive">Total cancelled</p>
          </div>
        </div>

        {!bookingStats.canCreatePending && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-warning flex-shrink-0" />
              <p className="text-warning text-xs sm:text-sm font-medium">
                {bookingStats.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
