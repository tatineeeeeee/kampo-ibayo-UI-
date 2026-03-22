import { Tables } from "@/database.types";
import { BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_TYPE } from "../constants";

/** Base booking type from Supabase (auto-generated) */
export type BookingRow = Tables<"bookings">;

/** Extended booking with optional user existence tracking (for admin views) */
export interface Booking extends BookingRow {
  user_exists?: boolean;
}

/** Minimal booking type for components that only need basic fields */
export interface BookingBasic {
  id: number;
  check_in_date: string;
  check_out_date: string;
  status: string | null;
}

/** Booking with payment details for payment-related views */
export interface BookingWithPayment {
  id: number;
  guest_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  status: string | null;
  payment_status: string | null;
  payment_type: string | null;
  payment_amount: number | null;
}

/** Booking status union type */
export type BookingStatus =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

/** Payment status union type */
export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/** Payment type union type */
export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];

/** Booking expiration info */
export interface BookingExpiration {
  id: number;
  guest_name: string;
  guest_email: string | null;
  created_at: string | null;
  daysPending: number;
}

/** Booking statistics for user limits */
export interface BookingStats {
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  canCreatePending: boolean;
  message?: string;
}

/** Price calculation result */
export interface PriceBreakdown {
  nights: Array<{
    date: Date;
    rate: number;
    isWeekend: boolean;
    dayName: string;
  }>;
  totalNights: number;
  totalBaseRate: number;
  excessGuestFee: number;
  totalAmount: number;
  breakdown: {
    weekdayNights: number;
    weekendNights: number;
    weekdayTotal: number;
    weekendTotal: number;
  };
}

/** Booking date entry from the booking_dates table */
export type BookingDate = Tables<"booking_dates">;
