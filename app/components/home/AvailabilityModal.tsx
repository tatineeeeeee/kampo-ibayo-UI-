"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { DayPicker, type DayButton } from "react-day-picker";
import {
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { INCLUDED_GUESTS, BASE_RATE_WEEKDAY, BASE_RATE_WEEKEND } from "../../lib/constants/pricing";
import { cn } from "../../lib/utils";

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Display-only DayButton — theme bg + colored dot for status
function AvailabilityDayButton({
  day,
  modifiers,
  className,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const isActive = !modifiers.disabled && !modifiers.outside;

  const dotColor = modifiers.checkIn
    ? "bg-blue-400"
    : modifiers.checkOut
      ? "bg-rose-400"
      : modifiers.occupied
        ? "bg-amber-400"
        : modifiers.sameDay
          ? "bg-violet-400"
          : isActive
            ? "bg-emerald-400"
            : null;

  return (
    <button
      {...props}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 text-sm rounded-full transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",

        // Outside month
        modifiers.outside && "opacity-20 pointer-events-none",

        // Disabled / past
        modifiers.disabled && !modifiers.outside &&
          "opacity-40 pointer-events-none cursor-not-allowed text-muted-foreground",

        // Active dates — subtle themed background
        isActive && "bg-primary/10 text-foreground hover:bg-primary/20 cursor-default",

        // Today — ring + bold
        modifiers.today && "ring-2 ring-primary/60 font-semibold",

        className,
      )}
    >
      <span className="leading-none">{day.date.getDate()}</span>
      {dotColor && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColor)} />
      )}
    </button>
  );
}

const AvailabilityModal = ({
  isOpen,
  onClose,
}: AvailabilityModalProps) => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const [existingBookings, setExistingBookings] = useState<
    {
      check_in_date: string;
      check_out_date: string;
      status: string | null;
    }[]
  >([]);

  // Fetch booked dates from database with caching
  const fetchBookedDates = useCallback(async (month: Date) => {
    try {
      const startOfMonth = new Date(
        month.getFullYear(),
        month.getMonth() - 1,
        15,
      );
      const endOfMonth = new Date(
        month.getFullYear(),
        month.getMonth() + 2,
        15,
      );

      const toYMD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
      };

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("check_in_date, check_out_date, status")
        .in("status", ["confirmed", "pending"])
        .or(
          `and(check_in_date.gte.${toYMD(startOfMonth)},check_in_date.lte.${toYMD(endOfMonth)}),and(check_out_date.gte.${toYMD(startOfMonth)},check_out_date.lte.${toYMD(endOfMonth)}),and(check_in_date.lte.${toYMD(startOfMonth)},check_out_date.gte.${toYMD(endOfMonth)})`,
        )
        .limit(50);

      if (error) {
        console.error("Error fetching bookings:", error);
        setExistingBookings([]);
        return;
      }

      setExistingBookings(bookings || []);

    } catch (error) {
      console.error("Error fetching booked dates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Build modifier date arrays from existingBookings
  const { checkInDates, checkOutDates, occupiedDates, sameDayDates } =
    useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const active = existingBookings.filter(
        (b) => b.status === "confirmed" || b.status === "pending",
      );

      const checkInArr: Date[] = [];
      const checkOutArr: Date[] = [];
      const occupiedArr: Date[] = [];
      const sameDayArr: Date[] = [];

      active.forEach((booking) => {
        const checkIn = new Date(booking.check_in_date);
        checkIn.setHours(0, 0, 0, 0);
        const checkOut = new Date(booking.check_out_date);
        checkOut.setHours(0, 0, 0, 0);

        if (checkIn < today && checkOut < today) return;

        if (checkIn.getTime() === checkOut.getTime()) {
          sameDayArr.push(new Date(checkIn));
        } else {
          if (checkIn >= today) checkInArr.push(new Date(checkIn));
          if (checkOut >= today) checkOutArr.push(new Date(checkOut));

          const cur = new Date(checkIn);
          cur.setDate(cur.getDate() + 1);
          while (cur < checkOut) {
            if (cur >= today) occupiedArr.push(new Date(cur));
            cur.setDate(cur.getDate() + 1);
          }
        }
      });

      return {
        checkInDates: checkInArr,
        checkOutDates: checkOutArr,
        occupiedDates: occupiedArr,
        sameDayDates: sameDayArr,
      };
    }, [existingBookings]);

  // Count available dates in current month
  const availableDatesCount = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const occupiedSet = new Set(occupiedDates.map((d) => d.getTime()));
    const sameDaySet = new Set(sameDayDates.map((d) => d.getTime()));
    const checkInSet = new Set(checkInDates.map((d) => d.getTime()));

    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      if (date >= today) {
        const t = date.getTime();
        if (!occupiedSet.has(t) && !sameDaySet.has(t) && !checkInSet.has(t)) {
          count++;
        }
      }
    }
    return count;
  }, [currentMonth, occupiedDates, sameDayDates, checkInDates]);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d;
  }, []);

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
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 sm:p-3 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation rounded-lg hover:bg-muted"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain">
          <div className="p-3 sm:p-4 md:p-4 lg:p-5">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-stretch">

              {/* Left Column: Calendar */}
              <div className="lg:w-1/2 xl:w-[55%] flex-shrink-0 flex flex-col">
                <div className="bg-muted/50 rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 border border-border flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    {loading ? (
                      <div className="flex items-center justify-center flex-1">
                        <div className="text-foreground text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                          <p>Loading availability...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border overflow-hidden flex-1 flex flex-col">
                      <DayPicker
                        month={currentMonth}
                        onMonthChange={(month) => {
                          setCurrentMonth(month);
                          fetchBookedDates(month);
                        }}
                        disabled={{ before: new Date() }}
                        startMonth={new Date()}
                        endMonth={maxDate}
                        modifiers={{
                          checkIn: checkInDates,
                          checkOut: checkOutDates,
                          occupied: occupiedDates,
                          sameDay: sameDayDates,
                        }}
                        /* onDayClick makes days "interactive" so DayButton renders */
                        onDayClick={() => {}}
                        navLayout="around"
                        fixedWeeks
                        showOutsideDays
                        formatters={{
                          formatWeekdayName: (d) =>
                            d.toLocaleDateString("en-US", { weekday: "short" }),
                        }}
                        components={{
                          DayButton: AvailabilityDayButton,
                          Chevron: ({ orientation, className }) => {
                            if (orientation === "left")
                              return <ChevronLeft className={cn("w-4 h-4", className)} />;
                            return <ChevronRight className={cn("w-4 h-4", className)} />;
                          },
                        }}
                        classNames={{
                          root: "w-full h-full select-none flex flex-col",
                          months: "w-full flex-1 flex flex-col",
                          month: "w-full flex-1 grid grid-cols-[2.5rem_1fr_2.5rem] grid-rows-[auto_1fr]",
                          month_grid: "w-full border-collapse col-span-3 flex-1 flex flex-col",
                          month_caption:
                            "flex items-center justify-center h-12 bg-primary",
                          caption_label: "text-white font-bold text-sm",
                          button_previous:
                            "flex items-center justify-center bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
                          button_next:
                            "flex items-center justify-center bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
                          weekdays: "flex w-full bg-primary/80",
                          weekday:
                            "flex-1 text-center text-white/85 text-xs font-semibold py-2.5",
                          weeks: "w-full flex-1 flex flex-col justify-evenly",
                          week: "flex w-full gap-x-0.5",
                          day: "flex-1 flex items-center justify-center",
                          day_button: "w-full aspect-square max-w-12 max-h-12 text-sm",
                          selected: "",
                          today: "",
                          outside: "",
                          disabled: "",
                          hidden: "invisible",
                        }}
                      />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Color Guide */}
              <div className="lg:w-1/2 xl:w-[45%] flex flex-col">
                <div className="bg-muted/30 border border-border rounded-lg md:rounded-xl p-3 sm:p-4 lg:p-5 flex-1 flex flex-col">
                  {/* Panel Header */}
                  <div className="flex flex-col gap-1 mb-3 lg:mb-4 flex-shrink-0">
                    <h4 className="text-foreground text-sm sm:text-base lg:text-lg font-semibold">
                      How to Read the Calendar
                    </h4>
                    <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                      Each date is color-coded to show its booking status. Use
                      the arrows to navigate months.
                    </p>
                  </div>

                  {/* 6 Compact Legend Cards */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:gap-3 content-start">
                    {/* Available */}
                    <div className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-all duration-200">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground text-xs sm:text-sm font-semibold leading-tight">Available</div>
                        <div className="text-muted-foreground text-[10px] sm:text-xs leading-tight mt-0.5">Open for booking</div>
                      </div>
                    </div>

                    {/* Check-in */}
                    <div className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-all duration-200">
                      <span className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground text-xs sm:text-sm font-semibold leading-tight">Check-in</div>
                        <div className="text-muted-foreground text-[10px] sm:text-xs leading-tight mt-0.5">Guests arrive 3 PM</div>
                      </div>
                    </div>

                    {/* Check-out */}
                    <div className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-all duration-200">
                      <span className="w-3 h-3 rounded-full bg-rose-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground text-xs sm:text-sm font-semibold leading-tight">Check-out</div>
                        <div className="text-muted-foreground text-[10px] sm:text-xs leading-tight mt-0.5">Leave 1 PM, new arrive 3 PM</div>
                      </div>
                    </div>

                    {/* Occupied */}
                    <div className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-all duration-200">
                      <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground text-xs sm:text-sm font-semibold leading-tight">Occupied</div>
                        <div className="text-muted-foreground text-[10px] sm:text-xs leading-tight mt-0.5">Resort fully occupied</div>
                      </div>
                    </div>

                    {/* Full Day */}
                    <div className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-all duration-200">
                      <span className="w-3 h-3 rounded-full bg-violet-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground text-xs sm:text-sm font-semibold leading-tight">Full Day</div>
                        <div className="text-muted-foreground text-[10px] sm:text-xs leading-tight mt-0.5">Same-day check-in &amp; out</div>
                      </div>
                    </div>

                    {/* Unavailable */}
                    <div className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-all duration-200">
                      <span className="w-3 h-3 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground text-xs sm:text-sm font-semibold leading-tight">Unavailable</div>
                        <div className="text-muted-foreground text-[10px] sm:text-xs leading-tight mt-0.5">Cannot be booked</div>
                      </div>
                    </div>
                  </div>

                  {/* Resort Info */}
                  <div className="mt-auto pt-3 lg:pt-4 space-y-2.5 lg:space-y-3">
                    {/* Rates */}
                    <div className="bg-background/60 rounded-lg p-3 sm:p-3.5 border border-border">
                      <h5 className="text-foreground text-xs sm:text-sm font-semibold mb-2">Resort Rates</h5>
                      <div className="space-y-1.5 text-[11px] sm:text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Weekdays (Mon-Thu)</span>
                          <span className="text-success font-semibold">&#8369;{BASE_RATE_WEEKDAY.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Weekends (Fri-Sun)</span>
                          <span className="text-warning font-semibold">&#8369;{BASE_RATE_WEEKEND.toLocaleString()}</span>
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
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border bg-card px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 flex-shrink-0 sticky bottom-0 z-10 modal-footer-safe flex items-center justify-between gap-3">
          {/* Left: Available count + live status */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${loading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`}
              />
              <span className="text-muted-foreground text-[10px] sm:text-xs">
                {loading ? "Syncing..." : "Live"}
              </span>
            </div>
            {!loading && (
              <>
                <div className="w-px h-3.5 bg-border" />
                <span className="text-muted-foreground text-[10px] sm:text-xs">
                  <span
                    className={`font-semibold ${availableDatesCount > 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
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
            type="button"
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
