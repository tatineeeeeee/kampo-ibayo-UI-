"use client";
import React from "react";

interface CalendarGridProps {
  calendarDays: Date[];
  currentDate: Date;
  getDateClasses: (date: Date) => string;
  getDateStatusIndicator: (date: Date) => string | null;
  handleDateClick: (date: Date) => void;
  isDateSelectable: (date: Date) => boolean;
  isDateBooked: (date: Date) => boolean;
  isDateInPast: (date: Date) => boolean;
  dayNames: string[];
  isLight: boolean;
}

export default function CalendarGrid({
  calendarDays,
  currentDate,
  getDateClasses,
  getDateStatusIndicator,
  handleDateClick,
  isDateSelectable,
  isDateBooked,
  isDateInPast,
  dayNames,
  isLight,
}: CalendarGridProps) {
  return (
    <div className="p-3 sm:p-4 lg:p-5">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className={`text-center text-[10px] sm:text-xs font-semibold py-1 uppercase tracking-wide ${isLight ? "text-slate-500" : "text-muted-foreground"}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days - Premium Responsive Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2">
        {calendarDays.map((date, index) => {
          const statusIndicator = getDateStatusIndicator(date);
          return (
            <button
              type="button"
              key={index}
              onClick={() => handleDateClick(date)}
              className={getDateClasses(date)}
              disabled={!isDateSelectable(date)}
              title={
                isDateBooked(date)
                  ? "Not available - Resort is booked"
                  : isDateInPast(date)
                    ? "Past date - Cannot select"
                    : "Available for booking"
              }
            >
              <span className="relative z-10">{date.getDate()}</span>
              {statusIndicator && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 px-0.5 text-[4px] sm:text-[6px] lg:text-[7px] font-black rounded shadow-sm whitespace-nowrap leading-tight ${isLight ? "bg-card/80 text-white" : "bg-black/90 text-white"}`}>
                  {statusIndicator}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
