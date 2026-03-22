"use client";

import { useCallback } from "react";
import {
  BASE_RATE_WEEKDAY,
  BASE_RATE_WEEKEND,
  EXTRA_GUEST_FEE,
  INCLUDED_GUESTS,
  PHILIPPINE_HOLIDAYS,
  PEAK_SEASON_RANGES,
} from "../lib/constants/pricing";
import type { PriceBreakdown } from "../lib/types/booking";

/** Format a Date to YYYY-MM-DD string for comparison */
function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Check if a date string falls within any peak season range */
function isPeakSeason(dateString: string): boolean {
  return PEAK_SEASON_RANGES.some(
    ({ start, end }) => dateString >= start && dateString <= end,
  );
}

/**
 * Hook for calculating booking prices with per-day rates.
 * Handles weekday/weekend/holiday/peak-season differentiation and excess guest fees.
 */
export function usePriceCalculation() {
  const calculateMultiDayPrice = useCallback(
    (
      checkInDate: Date,
      checkOutDate: Date,
      guestCount: number = INCLUDED_GUESTS,
    ): PriceBreakdown => {
      const nights: PriceBreakdown["nights"] = [];
      const current = new Date(checkInDate);
      const end = new Date(checkOutDate);

      while (current < end) {
        const day = current.getDay();
        const dateString = toDateString(current);
        const isHoliday = (PHILIPPINE_HOLIDAYS as readonly string[]).includes(dateString);
        const isWeekend = day === 0 || day === 5 || day === 6;
        const isPeak = isPeakSeason(dateString);
        const nightRate =
          isWeekend || isHoliday || isPeak ? BASE_RATE_WEEKEND : BASE_RATE_WEEKDAY;

        nights.push({
          date: new Date(current),
          rate: nightRate,
          isWeekend: isWeekend || isHoliday || isPeak,
          dayName: current.toLocaleDateString("en-US", { weekday: "short" }),
        });

        current.setDate(current.getDate() + 1);
      }

      const totalBaseRate = nights.reduce((sum, night) => sum + night.rate, 0);
      const totalNights = nights.length;
      const excessGuestFee =
        guestCount > INCLUDED_GUESTS
          ? (guestCount - INCLUDED_GUESTS) * EXTRA_GUEST_FEE * totalNights
          : 0;

      return {
        nights,
        totalNights,
        totalBaseRate,
        excessGuestFee,
        totalAmount: totalBaseRate + excessGuestFee,
        breakdown: {
          weekdayNights: nights.filter((n) => !n.isWeekend).length,
          weekendNights: nights.filter((n) => n.isWeekend).length,
          weekdayTotal:
            nights.filter((n) => !n.isWeekend).length * BASE_RATE_WEEKDAY,
          weekendTotal:
            nights.filter((n) => n.isWeekend).length * BASE_RATE_WEEKEND,
        },
      };
    },
    [],
  );

  const calculateSingleDayPrice = useCallback(
    (checkInDate: Date, guestCount: number = INCLUDED_GUESTS): number => {
      const nextDay = new Date(checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return calculateMultiDayPrice(checkInDate, nextDay, guestCount)
        .totalAmount;
    },
    [calculateMultiDayPrice],
  );

  return { calculateMultiDayPrice, calculateSingleDayPrice };
}
