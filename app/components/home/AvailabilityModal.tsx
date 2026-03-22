"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker-availability.css";
import {
  X,
  CalendarDays,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { INCLUDED_GUESTS } from "../../lib/constants/pricing";

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AvailabilityModal = ({
  isOpen,
  onClose,
}: AvailabilityModalProps) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return now;
  });
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  // Store actual booking data for proper date type determination
  const [existingBookings, setExistingBookings] = useState<
    {
      check_in_date: string;
      check_out_date: string;
      status: string | null;
    }[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [monthCache, setMonthCache] = useState<{ [key: string]: string[] }>({});

  // Fetch booked dates from database with caching
  const fetchBookedDates = useCallback(async (month: Date) => {
    const monthKey = `${month.getFullYear()}-${month.getMonth()}`;

    // setLoading(true) is only called on initial modal open via useEffect
    // Month navigation fetches silently without showing loading spinner
    try {
      // Extend range to include previous and next month dates that appear in calendar
      const startOfMonth = new Date(
        month.getFullYear(),
        month.getMonth() - 1,
        15,
      ); // Start from mid previous month
      const endOfMonth = new Date(
        month.getFullYear(),
        month.getMonth() + 2,
        15,
      ); // End in mid next month

      // Helper to format local date as YYYY-MM-DD (avoid timezone shifts)
      const toYMD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
      };


      // HOMEPAGE: Show BOTH confirmed AND pending bookings for availability display
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("check_in_date, check_out_date, status")
        .in("status", ["confirmed", "pending"]) // Show both confirmed and pending bookings
        .or(
          `and(check_in_date.gte.${toYMD(
            startOfMonth,
          )},check_in_date.lte.${toYMD(
            endOfMonth,
          )}),and(check_out_date.gte.${toYMD(
            startOfMonth,
          )},check_out_date.lte.${toYMD(
            endOfMonth,
          )}),and(check_in_date.lte.${toYMD(
            startOfMonth,
          )},check_out_date.gte.${toYMD(endOfMonth)})`,
        )
        .limit(50); // Reasonable limit

      if (error) {
        console.error("Error fetching bookings:", error);
        setExistingBookings([]);
        return;
      }


      // Store the actual booking data for date type determination
      setExistingBookings(bookings || []);

      // NEW LOGIC: Count check-ins AND checkouts for same-day turnover capacity
      const checkInCounts = new Map<string, number>();
      const checkOutCounts = new Map<string, number>();

      bookings?.forEach((booking) => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);

        const checkInDate = toYMD(checkIn);
        const checkOutDate = toYMD(checkOut);


        // Count check-ins for the displayed month
        if (
          checkIn.getMonth() === month.getMonth() &&
          checkIn.getFullYear() === month.getFullYear()
        ) {
          const prev = checkInCounts.get(checkInDate) || 0;
          checkInCounts.set(checkInDate, prev + 1);
        }

        // Count check-outs for the displayed month (same-day turnover availability)
        if (
          checkOut.getMonth() === month.getMonth() &&
          checkOut.getFullYear() === month.getFullYear()
        ) {
          const prevCheckOuts = checkOutCounts.get(checkOutDate) || 0;
          checkOutCounts.set(checkOutDate, prevCheckOuts + 1);
        }
      });

      // Save per-day counts for UI indicators (combine check-ins and check-outs for same-day turnover display)
      const countsObj: Record<string, number> = {};

      // Count check-ins (guests arriving - takes up capacity)
      for (const [k, v] of checkInCounts.entries()) {
        countsObj[k] = (countsObj[k] || 0) + v;
      }

      // Count check-outs (guests leaving - shows turnover activity and enables same-day bookings)
      // When there's both check-in and check-out on same date, it shows full capacity utilization
      for (const [k, v] of checkOutCounts.entries()) {
        countsObj[k] = (countsObj[k] || 0) + v; // Add check-outs to show total daily activity
      }

      // setDayCounts(countsObj); // Removed since we're using React DatePicker

      // Only mark dates as unavailable when check-in capacity (2) is reached or exceeded
      const bookedArray = Array.from(checkInCounts.entries())
        .filter(([, count]) => count >= 2)
        .map(([date]) => date);


      // Cache the result (we can keep for future optimization)
      setMonthCache((prev) => ({ ...prev, [monthKey]: bookedArray }));
    } catch (error) {
      console.error("Error fetching booked dates:", error);
      // Fallback to empty on error
      // setDayCounts({}); // Removed since we're using React DatePicker
    } finally {
      setLoading(false);
    }
  }, []); // Remove monthCache dependency for now

  // Fetch booked dates when modal opens or month changes
  useEffect(() => {
    if (isOpen) {
      if (!hasLoadedRef.current) {
        setLoading(true);
        hasLoadedRef.current = true;
      }
      fetchBookedDates(currentMonth);
    } else {
      hasLoadedRef.current = false;
    }
  }, [isOpen, currentMonth, fetchBookedDates]);

  // Calculate date capacity and type for visual indicators (EXACT same as booking page)
  const getDateCapacity = (date: Date) => {
    // Don't show capacity indicators for past dates (before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      return ""; // Only past dates (before today) should appear normal
    }

    const activeBookings = existingBookings.filter(
      (booking) =>
        booking.status === "confirmed" || booking.status === "pending",
    );

    // Normalize date for comparison (remove time component)
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let isCheckIn = false;
    let isCheckOut = false;
    let isOccupied = false;

    activeBookings.forEach((booking) => {
      const checkIn = new Date(booking.check_in_date);
      checkIn.setHours(0, 0, 0, 0);

      const checkOut = new Date(booking.check_out_date);
      checkOut.setHours(0, 0, 0, 0);

      // Check if this date is a check-in date
      if (targetDate.getTime() === checkIn.getTime()) {
        isCheckIn = true;
      }

      // Check if this date is a check-out date
      if (targetDate.getTime() === checkOut.getTime()) {
        isCheckOut = true;
      }

      // Check if this date is between check-in and check-out (occupied)
      if (targetDate > checkIn && targetDate < checkOut) {
        isOccupied = true;
      }
    });

    // Determine the appropriate indicator (same logic as booking page)
    if (isCheckIn && isCheckOut) {
      return "same-day"; // Same day check-in and check-out (1-day stay)
    } else if (isCheckIn) {
      return "checkin";
    } else if (isCheckOut) {
      return "checkout";
    } else if (isOccupied) {
      return "occupied";
    }

    return "";
  };

  // Count available dates in current month for footer display
  const availableDatesCount = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      if (date >= today) {
        const capacity = getDateCapacity(date);
        if (capacity === "" || capacity === "checkout") count++;
      }
    }
    return count;
  }, [currentMonth, existingBookings]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-0 sm:p-2 md:p-4 overflow-y-auto modal-scroll-lock">
            <div className="bg-card rounded-none sm:rounded-xl md:rounded-2xl shadow-2xl w-full sm:max-w-[95vw] md:max-w-2xl lg:max-w-5xl xl:max-w-6xl border-0 sm:border border-border min-h-screen sm:min-h-0 sm:max-h-[98vh] md:max-h-[95vh] lg:max-h-[92vh] xl:max-h-[90vh] overflow-hidden flex flex-col mt-0 sm:mt-2 md:mt-0">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-border bg-card flex-shrink-0 sticky top-0 z-10">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
                  <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary flex-shrink-0" />
                  <span className="truncate">Check Availability</span>
                </h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 sm:p-3 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation rounded-lg hover:bg-muted"
                >
                  <X className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain">
                <div className="p-3 sm:p-4 md:p-4 lg:p-5">
                  {/* Two-column layout: Calendar LEFT, Legend RIGHT on desktop */}
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-stretch">
                  {/* Left Column: Calendar */}
                  <div className="lg:w-1/2 xl:w-[55%] flex-shrink-0 flex flex-col">
                  {/* Calendar View - React DatePicker (Read-only for availability display) */}
                  <div className="bg-muted/50 rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 border border-border flex-1 flex flex-col">
                    <div className="flex-1 flex flex-col min-h-[470px] sm:min-h-[500px]">
                      {loading ? (
                        <div className="flex items-center justify-center flex-1">
                          <div className="text-foreground text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                            <p>Loading availability...</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <DatePicker
                            onChange={() => {}} // Read-only - no interaction needed
                            openToDate={currentMonth}
                            dayClassName={(date) => {
                              // Show booking status for all dates regardless of which month view
                              const capacity = getDateCapacity(date);

                              if (capacity === "same-day")
                                return "react-datepicker__day--same-day";
                              if (capacity === "checkin")
                                return "react-datepicker__day--checkin";
                              if (capacity === "checkout")
                                return "react-datepicker__day--checkout";
                              if (capacity === "occupied")
                                return "react-datepicker__day--occupied";
                              return "";
                            }}
                            inline
                            monthsShown={1}
                            calendarClassName="inline-calendar"
                            minDate={new Date()}
                            maxDate={(() => {
                              const maxDate = new Date();
                              maxDate.setFullYear(maxDate.getFullYear() + 2);
                              return maxDate;
                            })()}
                            readOnly
                            disabled={false}
                            fixedHeight
                            renderCustomHeader={({
                              date,
                              decreaseMonth,
                              increaseMonth,
                              prevMonthButtonDisabled,
                              nextMonthButtonDisabled,
                            }) => {
                              const handlePrevMonth = () => {
                                const newDate = new Date(
                                  date.getFullYear(),
                                  date.getMonth() - 1,
                                  1,
                                );
                                setCurrentMonth(newDate);
                                fetchBookedDates(newDate);
                                decreaseMonth();
                              };

                              const handleNextMonth = () => {
                                const newDate = new Date(
                                  date.getFullYear(),
                                  date.getMonth() + 1,
                                  1,
                                );
                                setCurrentMonth(newDate);
                                fetchBookedDates(newDate);
                                increaseMonth();
                              };

                              return (
                                <div className="flex items-center justify-between px-4 py-3">
                                  <button
                                    onClick={handlePrevMonth}
                                    disabled={prevMonthButtonDisabled}
                                    className="w-8 h-8 bg-muted hover:bg-secondary rounded-full flex items-center justify-center text-foreground font-bold text-lg transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed border border-border"
                                  >
                                    ◀
                                  </button>
                                  <span className="text-foreground font-bold text-lg px-4 py-2">
                                    {currentMonth.toLocaleDateString("en-US", {
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </span>
                                  <button
                                    onClick={handleNextMonth}
                                    disabled={nextMonthButtonDisabled}
                                    className="w-8 h-8 bg-muted hover:bg-secondary rounded-full flex items-center justify-center text-foreground font-bold text-lg transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed border border-border"
                                  >
                                    ▶
                                  </button>
                                </div>
                              );
                            }}
                          />

                        </>
                      )}
                    </div>
                  </div>
                  </div>{/* End Left Column */}

                  {/* Right Column: Color Guide */}
                  <div className="lg:w-1/2 xl:w-[45%] flex flex-col">
                  <div className="bg-muted/30 border border-border rounded-lg md:rounded-xl p-3 sm:p-4 lg:p-5 flex-1 flex flex-col">
                    {/* Panel Header */}
                    <div className="flex flex-col gap-1 mb-3 lg:mb-4 flex-shrink-0">
                      <h4 className="text-foreground text-sm sm:text-base lg:text-lg font-semibold">
                        How to Read the Calendar
                      </h4>
                      <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                        Each date is color-coded to show its booking status. Use the arrows to navigate months.
                      </p>
                    </div>

                    {/* 6 Compact Legend Cards */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:gap-3 content-start">
                      {/* Available */}
                      <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-emerald-900/15 border border-emerald-600/20 rounded-lg hover:bg-emerald-900/25 hover:border-emerald-600/30 transition-all duration-200">
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0" style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}></span>
                        <div className="min-w-0 flex-1">
                          <div className="text-emerald-200 text-xs sm:text-sm font-semibold leading-tight">Available</div>
                          <div className="text-emerald-100/70 text-[10px] sm:text-xs leading-tight mt-0.5">Open for booking</div>
                        </div>
                      </div>

                      {/* Check-in */}
                      <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-primary/8 border border-primary/20 rounded-lg hover:bg-primary/15 hover:border-primary/30 transition-all duration-200">
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0" style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }}></span>
                        <div className="min-w-0 flex-1">
                          <div className="text-blue-200 text-xs sm:text-sm font-semibold leading-tight">Check-in</div>
                          <div className="text-blue-100/70 text-[10px] sm:text-xs leading-tight mt-0.5">Guests arrive 3 PM</div>
                        </div>
                      </div>

                      {/* Check-out */}
                      <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-rose-900/15 border border-rose-600/20 rounded-lg hover:bg-rose-900/25 hover:border-rose-600/30 transition-all duration-200">
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0" style={{ background: "linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)" }}></span>
                        <div className="min-w-0 flex-1">
                          <div className="text-rose-200 text-xs sm:text-sm font-semibold leading-tight">Check-out</div>
                          <div className="text-rose-100/70 text-[10px] sm:text-xs leading-tight mt-0.5">Leave 1 PM, new arrive 3 PM</div>
                        </div>
                      </div>

                      {/* Occupied */}
                      <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-yellow-900/15 border border-yellow-500/20 rounded-lg hover:bg-yellow-900/25 hover:border-yellow-500/30 transition-all duration-200">
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0" style={{ background: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)" }}></span>
                        <div className="min-w-0 flex-1">
                          <div className="text-yellow-200 text-xs sm:text-sm font-semibold leading-tight">Occupied</div>
                          <div className="text-yellow-100/70 text-[10px] sm:text-xs leading-tight mt-0.5">Resort fully occupied</div>
                        </div>
                      </div>

                      {/* Full Day */}
                      <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-violet-900/15 border border-violet-600/20 rounded-lg hover:bg-violet-900/25 hover:border-violet-600/30 transition-all duration-200">
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}></span>
                        <div className="min-w-0 flex-1">
                          <div className="text-violet-200 text-xs sm:text-sm font-semibold leading-tight">Full Day</div>
                          <div className="text-violet-100/70 text-[10px] sm:text-xs leading-tight mt-0.5">Same-day check-in & out</div>
                        </div>
                      </div>

                      {/* Unavailable */}
                      <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-all duration-200">
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-muted-foreground/40 flex-shrink-0"></span>
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground text-xs sm:text-sm font-semibold leading-tight">Unavailable</div>
                          <div className="text-muted-foreground text-[10px] sm:text-xs leading-tight mt-0.5">Cannot be booked</div>
                        </div>
                      </div>
                    </div>

                    {/* Resort Info — fills remaining space */}
                    <div className="mt-auto pt-3 lg:pt-4 space-y-2.5 lg:space-y-3">
                      {/* Rates */}
                      <div className="bg-background/60 rounded-lg p-3 sm:p-3.5 border border-border">
                        <h5 className="text-foreground text-xs sm:text-sm font-semibold mb-2">Resort Rates</h5>
                        <div className="space-y-1.5 text-[11px] sm:text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Weekdays (Mon-Thu)</span>
                            <span className="text-green-400 font-semibold">&#8369;9,000</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Weekends (Fri-Sun)</span>
                            <span className="text-yellow-400 font-semibold">&#8369;12,000</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Info */}
                      <div className="bg-background/60 rounded-lg p-3 sm:p-3.5 border border-border">
                        <div className="space-y-1.5 text-[11px] sm:text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">&#9679;</span>
                            <span>22-hour stay per booking</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">&#9679;</span>
                            <span>{`Up to ${INCLUDED_GUESTS} guests included`}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">&#9679;</span>
                            <span>All amenities included</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>{/* End Right Column */}
                  </div>{/* End Two-column flex row */}

                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-border bg-card px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 flex-shrink-0 sticky bottom-0 z-10 modal-footer-safe flex items-center justify-between gap-3">
                {/* Left: Available count + live status */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${loading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`}></div>
                    <span className="text-muted-foreground text-[10px] sm:text-xs">
                      {loading ? "Syncing..." : "Live"}
                    </span>
                  </div>
                  {!loading && (
                    <>
                      <div className="w-px h-3.5 bg-border"></div>
                      <span className="text-muted-foreground text-[10px] sm:text-xs">
                        <span className={`font-semibold ${availableDatesCount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {availableDatesCount}
                        </span>
                        {" "}available in{" "}
                        {currentMonth.toLocaleDateString("en-US", { month: "long" })}
                      </span>
                    </>
                  )}
                </div>
                {/* Right: Close */}
                <button
                  onClick={onClose}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 border border-border min-h-[36px] sm:min-h-[40px] touch-manipulation flex-shrink-0"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
  );
};

export default AvailabilityModal;
