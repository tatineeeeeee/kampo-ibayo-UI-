"use client";

import { Tables } from "../../../database.types";
import { formatBookingNumber } from "../../utils/bookingNumber";
import AvailabilityCalendar from "../AvailabilityCalendar";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Lightbulb,
  Edit3,
} from "lucide-react";

type Booking = Tables<"bookings">;

interface RescheduleBookingModalProps {
  booking: Booking;
  newCheckInDate: string;
  newCheckOutDate: string;
  rescheduleLoading: boolean;
  showCalendar: boolean;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  onCalendarToggle: (show: boolean) => void;
  onCalendarDateSelect: (checkIn: string, checkOut: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function RescheduleBookingModal({
  booking,
  newCheckInDate,
  newCheckOutDate,
  rescheduleLoading,
  showCalendar,
  onCheckInChange,
  onCheckOutChange,
  onCalendarToggle,
  onCalendarDateSelect,
  onConfirm,
  onClose,
}: RescheduleBookingModalProps) {
  const nightsCount =
    newCheckInDate && newCheckOutDate
      ? Math.ceil(
          (new Date(newCheckOutDate).getTime() - new Date(newCheckInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden border-0 sm:border border-border animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-5 pt-4 pb-3 border-b border-border dark:border-border">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4 sm:hidden"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Calendar className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Reschedule</h3>
                <p className="text-xs text-muted-foreground">{formatBookingNumber(booking.id)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted transition-colors"
            >
              <XCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-200px)]">
          {/* Current Booking Summary */}
          <div className="px-5 pt-4">
            <div className="bg-muted rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Current Dates
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-card rounded-xl p-3 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Check-in
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(booking.check_in_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-muted-foreground">&rarr;</div>
                <div className="flex-1 bg-card rounded-xl p-3 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Check-out
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(booking.check_out_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="px-5 pt-4">
            <div className="flex bg-muted rounded-xl p-1">
              <button
                onClick={() => onCalendarToggle(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  showCalendar
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </button>
              <button
                onClick={() => onCalendarToggle(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  !showCalendar
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Manual
              </button>
            </div>
          </div>

          {/* Date Selection */}
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-warning" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Select New Dates
              </span>
            </div>

            {showCalendar ? (
              <div className="border border-border rounded-2xl overflow-hidden bg-card">
                <AvailabilityCalendar
                  selectedCheckIn={booking.check_in_date.split("T")[0]}
                  selectedCheckOut={booking.check_out_date.split("T")[0]}
                  onDateSelect={onCalendarDateSelect}
                  excludeBookingId={booking.id}
                  minDate={new Date().toISOString().split("T")[0]}
                  isRescheduling={true}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-card rounded-xl border border-border p-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    New Check-in
                  </label>
                  <input
                    type="date"
                    value={newCheckInDate}
                    onChange={(e) => onCheckInChange(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-ring text-foreground text-base font-medium"
                  />
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    New Check-out
                  </label>
                  <input
                    type="date"
                    value={newCheckOutDate}
                    onChange={(e) => onCheckOutChange(e.target.value)}
                    min={newCheckInDate || new Date().toISOString().split("T")[0]}
                    className="w-full p-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-ring text-foreground text-base font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Selected Dates Preview */}
          {newCheckInDate && newCheckOutDate && (
            <div className="px-5 pt-4">
              <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-warning" />
                  <span className="text-xs font-medium text-warning uppercase tracking-wide">
                    New Dates Selected
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-warning/70 uppercase tracking-wide mb-0.5">
                      Check-in
                    </p>
                    <p className="text-sm font-bold text-warning">
                      {new Date(newCheckInDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-warning">&rarr;</div>
                  <div className="flex-1 text-right">
                    <p className="text-[10px] text-warning/70 uppercase tracking-wide mb-0.5">
                      Check-out
                    </p>
                    <p className="text-sm font-bold text-warning">
                      {new Date(newCheckOutDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-warning/20">
                  <p className="text-xs text-center text-warning">
                    {nightsCount} night{nightsCount !== 1 ? "s" : ""} stay
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Preview */}
          {newCheckInDate &&
            newCheckOutDate &&
            (() => {
              const checkIn = new Date(newCheckInDate);
              const checkOut = new Date(newCheckOutDate);
              if (checkOut <= checkIn) return null;

              let newTotal = 0;
              const currentNight = new Date(checkIn);
              const nights = [];
              while (currentNight < checkOut) {
                const day = currentNight.getDay();
                const isWeekend = day === 0 || day === 5 || day === 6;
                const rate = isWeekend ? 12000 : 9000;
                nights.push({ isWeekend, rate });
                newTotal += rate;
                currentNight.setDate(currentNight.getDate() + 1);
              }
              const guestCount = booking.number_of_guests || 15;
              if (guestCount > 15) {
                newTotal += (guestCount - 15) * 300 * nights.length;
              }

              const currentAmount = booking.total_amount || 0;
              const difference = newTotal - currentAmount;

              return (
                <div className="px-5 pt-4">
                  <div
                    className={`rounded-xl p-4 border ${
                      difference > 0
                        ? "bg-warning/10 border-warning/20"
                        : difference < 0
                          ? "bg-success/10 border-success/20"
                          : "bg-muted border-border"
                    }`}
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Pricing Preview
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Current booking</span>
                        <span>&peso;{currentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>
                          New dates ({nights.length} night{nights.length !== 1 ? "s" : ""})
                        </span>
                        <span>&peso;{newTotal.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-border pt-1.5">
                        {difference > 0 ? (
                          <div className="flex justify-between font-semibold text-warning">
                            <span>Additional balance due</span>
                            <span>&peso;{difference.toLocaleString()}</span>
                          </div>
                        ) : difference < 0 ? (
                          <div className="flex justify-between font-semibold text-success">
                            <span>No additional payment</span>
                            <span>-&peso;{Math.abs(difference).toLocaleString()}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between font-semibold text-muted-foreground">
                            <span>Same price</span>
                            <span>No change</span>
                          </div>
                        )}
                      </div>
                      {difference > 0 && (
                        <p className="text-[10px] text-warning mt-1">
                          You will need to upload payment proof for the additional balance after
                          confirming.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Policy Notice */}
          <div className="px-5 pt-4 pb-4">
            <div className="flex items-start gap-3 bg-primary/5 dark:bg-primary/5 border border-primary/20 dark:border-primary/20 rounded-xl p-3">
              <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-primary/80 space-y-1">
                <p className="font-medium">Reschedule policy</p>
                <p className="text-primary/80 dark:text-primary/80">
                  Maximum 2 reschedules per booking. Must be at least 3 days before check-in.
                  Original dates will be released for new bookings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border dark:border-border p-4 pb-6 sm:pb-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-muted text-muted-foreground py-3.5 rounded-xl font-semibold hover:bg-muted transition-colors active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!newCheckInDate || !newCheckOutDate || rescheduleLoading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-foreground py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 active:scale-[0.98]"
            >
              {rescheduleLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
