"use client";

import { CalendarDays } from "lucide-react";
import AvailabilityCalendar from "../../../components/AvailabilityCalendar";
import type { Booking } from "../../../lib/types";

interface BookingRescheduleFormProps {
  selectedBooking: Booking;
  rescheduleCheckIn: string;
  rescheduleCheckOut: string;
  rescheduleReason: string;
  rescheduleLoading: boolean;
  onSetRescheduleCheckIn: (date: string) => void;
  onSetRescheduleCheckOut: (date: string) => void;
  onSetRescheduleReason: (reason: string) => void;
  onSetShowRescheduleModal: (show: boolean) => void;
  onAdminReschedule: () => void;
}

export function BookingRescheduleForm({
  selectedBooking,
  rescheduleCheckIn,
  rescheduleCheckOut,
  rescheduleReason,
  rescheduleLoading,
  onSetRescheduleCheckIn,
  onSetRescheduleCheckOut,
  onSetRescheduleReason,
  onSetShowRescheduleModal,
  onAdminReschedule,
}: BookingRescheduleFormProps) {
  return (
    <div className="space-y-4">
      {/* Reschedule Header */}
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">
          Reschedule Booking
        </h3>
      </div>

      <div className="bg-primary/10 border border-info/20 rounded-lg p-3 text-sm text-primary">
        <strong>Current dates:</strong>{" "}
        {new Date(selectedBooking.check_in_date).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric" },
        )}
        {" → "}
        {new Date(
          selectedBooking.check_out_date,
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>

      {/* Calendar */}
      <div>
        <AvailabilityCalendar
          selectedCheckIn={rescheduleCheckIn}
          selectedCheckOut={rescheduleCheckOut}
          onDateSelect={(checkIn, checkOut) => {
            onSetRescheduleCheckIn(checkIn);
            onSetRescheduleCheckOut(checkOut);
          }}
          excludeBookingId={selectedBooking.id}
          minDate={new Date().toISOString().split("T")[0]}
          isRescheduling={true}
          theme="light"
        />
      </div>

      {rescheduleCheckIn && rescheduleCheckOut && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-sm text-success">
          <strong>New dates:</strong>{" "}
          {new Date(
            rescheduleCheckIn + "T00:00:00",
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {" → "}
          {new Date(
            rescheduleCheckOut + "T00:00:00",
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      )}

      {/* Reason (optional) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Reason (optional)
        </label>
        <input
          type="text"
          value={rescheduleReason}
          onChange={(e) => onSetRescheduleReason(e.target.value)}
          placeholder="e.g. Guest requested date change"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onAdminReschedule}
          disabled={
            rescheduleLoading ||
            !rescheduleCheckIn ||
            !rescheduleCheckOut
          }
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition shadow-sm text-white ${
            rescheduleLoading ||
            !rescheduleCheckIn ||
            !rescheduleCheckOut
              ? "bg-muted-foreground cursor-not-allowed"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          {rescheduleLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </span>
          ) : (
            "Confirm Reschedule"
          )}
        </button>
        <button
          onClick={() => onSetShowRescheduleModal(false)}
          disabled={rescheduleLoading}
          className="px-6 py-3 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted transition disabled:opacity-50"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
