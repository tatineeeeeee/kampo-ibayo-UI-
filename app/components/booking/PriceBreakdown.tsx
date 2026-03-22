"use client";

import {
  FaCheck,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { BASE_RATE_WEEKDAY, BASE_RATE_WEEKEND, EXTRA_GUEST_FEE, INCLUDED_GUESTS } from "../../lib/constants/pricing";
import { CHECK_IN_TIME, CHECK_OUT_TIME } from "../../lib/constants";

interface PricingBreakdown {
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

interface PriceBreakdownProps {
  formData: {
    checkIn: Date | null;
    checkOut: Date | null;
    guests: string;
  };
  estimatedPrice: number | null;
  pricingBreakdown: PricingBreakdown | null;
  paymentType: "half" | "full";
}

export default function PriceBreakdown({
  formData,
  estimatedPrice,
  pricingBreakdown,
  paymentType,
}: PriceBreakdownProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center">
            <span className="text-white font-bold text-lg">₱</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Booking Summary
          </h3>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            paymentType === "half"
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-success/10 text-success border border-success/30"
          }`}
        >
          {paymentType === "half" ? "50% Payment" : "Full Payment"}
        </div>
      </div>
      <div className="space-y-2">
        {/* Check-in and Check-out Dates */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="p-2.5 bg-card/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Check-in</p>
            <p className="text-foreground font-semibold text-sm">
              {formData.checkIn
                ? formData.checkIn.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "Select date"}
            </p>
            <p className="text-xs text-success mt-0.5">● {CHECK_IN_TIME}</p>
          </div>
          <div className="p-2.5 bg-card/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Check-out</p>
            <p className="text-foreground font-semibold text-sm">
              {formData.checkOut
                ? formData.checkOut.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "Select date"}
            </p>
            <p className="text-xs text-warning mt-0.5">
              ● {CHECK_OUT_TIME}
            </p>
          </div>
        </div>

        {estimatedPrice &&
        formData.checkIn &&
        formData.checkOut &&
        pricingBreakdown ? (
          <>
            {/* Multi-day pricing breakdown */}
            <div className="p-3 bg-card/50 rounded-lg mb-2">
              {/* Compact pricing breakdown */}
              <div className="space-y-1.5 text-xs">
                {pricingBreakdown.breakdown.weekdayNights > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {pricingBreakdown.breakdown.weekdayNights}{" "}
                      {pricingBreakdown.breakdown.weekdayNights === 1
                        ? "weekday"
                        : "weekdays"}{" "}
                      × ₱{BASE_RATE_WEEKDAY.toLocaleString()}
                    </span>
                    <span className="text-foreground">
                      ₱
                      {pricingBreakdown.breakdown.weekdayTotal.toLocaleString()}
                    </span>
                  </div>
                )}
                {pricingBreakdown.breakdown.weekendNights > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {pricingBreakdown.breakdown.weekendNights}{" "}
                      {pricingBreakdown.breakdown.weekendNights === 1
                        ? "weekend"
                        : "weekends"}{" "}
                      × ₱{BASE_RATE_WEEKEND.toLocaleString()}
                    </span>
                    <span className="text-foreground">
                      ₱
                      {pricingBreakdown.breakdown.weekendTotal.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`flex justify-between items-center p-2.5 rounded-lg border ${
                formData.guests && parseInt(formData.guests) > INCLUDED_GUESTS
                  ? "bg-warning/10 border-warning/30"
                  : "bg-card/50 border-border"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  formData.guests && parseInt(formData.guests) > INCLUDED_GUESTS
                    ? "text-warning"
                    : "text-muted-foreground"
                }`}
              >
                Extra Guests{" "}
                {formData.guests && parseInt(formData.guests) > INCLUDED_GUESTS
                  ? `(+${parseInt(formData.guests) - INCLUDED_GUESTS})`
                  : "(+0)"}
                :
              </span>
              <span
                className={`font-semibold ${
                  formData.guests && parseInt(formData.guests) > INCLUDED_GUESTS
                    ? "text-warning"
                    : "text-foreground"
                }`}
              >
                {formData.guests &&
                parseInt(formData.guests) > INCLUDED_GUESTS &&
                pricingBreakdown
                  ? `+₱${pricingBreakdown.excessGuestFee.toLocaleString()}`
                  : "₱0"}
              </span>
            </div>

            {/* Show per-night breakdown for extra guests if multi-day */}
            {formData.guests &&
              parseInt(formData.guests) > INCLUDED_GUESTS &&
              pricingBreakdown &&
              pricingBreakdown.totalNights > 1 && (
                <div className="text-xs text-warning bg-warning/10 p-2 rounded flex items-start gap-1.5">
                  <FaInfoCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>
                    Extra guest fee: ₱{EXTRA_GUEST_FEE} ×{" "}
                    {parseInt(formData.guests) - INCLUDED_GUESTS} guests ×{" "}
                    {pricingBreakdown.totalNights} nights
                  </span>
                </div>
              )}
            <div className="pt-3 mt-2 border-t-2 border-border">
              {/* Simplified Payment Summary */}
              <div
                key={paymentType}
                className="transition-all duration-300"
              >
                {paymentType === "half" ? (
                  <div className="space-y-3">
                    {/* Main amount */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">
                        Pay Now (50%)
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        ₱
                        {Math.round(
                          estimatedPrice * 0.5,
                        ).toLocaleString()}
                      </span>
                    </div>
                    {/* Balance info */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Balance on arrival</span>
                      <span>
                        ₱
                        {(
                          estimatedPrice -
                          Math.round(estimatedPrice * 0.5)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Main amount */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">
                        Total Payment
                      </span>
                      <span className="text-2xl font-bold text-success">
                        ₱{estimatedPrice.toLocaleString()}
                      </span>
                    </div>
                    {/* Benefit */}
                    <div className="flex items-center gap-1.5 text-xs text-success">
                      <FaCheck className="w-3 h-3" />
                      <span>No payment needed on arrival</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {/* Show different content based on date selection state */}
            {formData.checkIn &&
            formData.checkOut &&
            formData.checkIn.toDateString() ===
              formData.checkOut.toDateString() ? (
              // Same day selected - invalid booking
              <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-warning text-sm font-medium">
                      Same-day booking
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Please select a different check-out date for at
                      least 1 night stay.
                    </p>
                  </div>
                </div>
              </div>
            ) : !formData.checkIn ? (
              // No dates selected - show rates preview
              <>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    Nightly Rates
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Mon - Thu
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        ₱{BASE_RATE_WEEKDAY.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Fri - Sat
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        ₱{BASE_RATE_WEEKEND.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border">
                      <span className="text-muted-foreground">
                        Extra guest ({INCLUDED_GUESTS + 1}+)
                      </span>
                      <span className="text-muted-foreground">
                        +₱{EXTRA_GUEST_FEE}/night
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center pt-1">
                  <p className="text-muted-foreground text-xs">
                    Select dates above to calculate total
                  </p>
                </div>
              </>
            ) : (
              // Check-in selected, waiting for check-out
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                <div className="flex items-start gap-2">
                  <FaInfoCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-primary/80 text-sm font-medium">
                      Select check-out date
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Click another date on the calendar to complete
                      your booking.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
