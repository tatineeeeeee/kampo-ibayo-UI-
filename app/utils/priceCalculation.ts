/**
 * Server-side price calculation — mirrors usePriceCalculation hook logic.
 * Used in API routes to validate client-submitted prices.
 */

import {
  BASE_RATE_WEEKDAY,
  BASE_RATE_WEEKEND,
  EXTRA_GUEST_FEE,
  INCLUDED_GUESTS,
  MAX_GUESTS,
  PHILIPPINE_HOLIDAYS,
  PEAK_SEASON_RANGES,
} from "../lib/constants/pricing";

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isPeakSeason(dateString: string): boolean {
  return PEAK_SEASON_RANGES.some(
    ({ start, end }) => dateString >= start && dateString <= end,
  );
}

/**
 * Calculate the correct total price for a booking based on dates and guest count.
 * This is the authoritative server-side calculation — never trust client amounts.
 */
export function calculateBookingPrice(
  checkInDate: string,
  checkOutDate: string,
  guestCount: number,
): { totalAmount: number; isValid: boolean; error?: string } {
  // Validate guest count
  if (guestCount < 1 || guestCount > MAX_GUESTS || !Number.isInteger(guestCount)) {
    return { totalAmount: 0, isValid: false, error: `Guest count must be between 1 and ${MAX_GUESTS}` };
  }

  // Parse dates
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return { totalAmount: 0, isValid: false, error: "Invalid dates" };
  }

  if (checkOut <= checkIn) {
    return { totalAmount: 0, isValid: false, error: "Check-out must be after check-in" };
  }

  // Calculate nightly rates
  const current = new Date(checkIn);
  let totalBaseRate = 0;
  let totalNights = 0;

  while (current < checkOut) {
    const day = current.getDay();
    const dateString = toDateString(current);
    const isHoliday = (PHILIPPINE_HOLIDAYS as readonly string[]).includes(dateString);
    const isWeekend = day === 0 || day === 5 || day === 6;
    const isPeak = isPeakSeason(dateString);
    const nightRate = isWeekend || isHoliday || isPeak ? BASE_RATE_WEEKEND : BASE_RATE_WEEKDAY;

    totalBaseRate += nightRate;
    totalNights++;
    current.setDate(current.getDate() + 1);
  }

  if (totalNights === 0) {
    return { totalAmount: 0, isValid: false, error: "Booking must be at least 1 night" };
  }

  // Calculate excess guest fee
  const excessGuestFee =
    guestCount > INCLUDED_GUESTS
      ? (guestCount - INCLUDED_GUESTS) * EXTRA_GUEST_FEE * totalNights
      : 0;

  const totalAmount = totalBaseRate + excessGuestFee;

  return { totalAmount, isValid: true };
}
