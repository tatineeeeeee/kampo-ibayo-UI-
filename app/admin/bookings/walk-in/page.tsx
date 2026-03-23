"use client";

import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Calendar,
  Users,
  Phone,
  Mail,
  User,
  CreditCard,
  Check,
  AlertCircle,
  Moon,
  PawPrint,
  Banknote,
  Info,
} from "lucide-react";
import AvailabilityCalendar from "../../../components/AvailabilityCalendar";
import { EXTRA_GUEST_FEE, INCLUDED_GUESTS, MAX_GUESTS, BASE_RATE_WEEKDAY, BASE_RATE_WEEKEND } from "../../../lib/constants/pricing";
import { CHECK_IN_TIME, CHECK_OUT_TIME } from "../../../lib/constants";
import { useWalkInBooking } from "../../../hooks/useWalkInBooking";

export default function WalkInBookingPage() {
  const {
    authLoading,
    guestName,
    setGuestName,
    guestEmail,
    setGuestEmail,
    guestPhone,
    setGuestPhone,
    numberOfGuests,
    setNumberOfGuests,
    bringsPet,
    setBringsPet,
    specialRequests,
    setSpecialRequests,
    selectedCheckIn,
    selectedCheckOut,
    handleDateSelect,
    todayString,
    pricing,
    totalAmount,
    isSubmitting,
    handleSubmit,
  } = useWalkInBooking();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-info/10 rounded-lg">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Create Walk-in Booking
            </h1>
            <p className="text-sm text-muted-foreground">
              Book on behalf of a walk-in guest — skip the payment proof upload
              process
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - Guest Details & Booking Options */}
          <div className="space-y-6">
            {/* Guest Information */}
            <div className="bg-card rounded-xl shadow-md p-5 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Guest Information
              </h2>

              <div className="space-y-4">
                {/* Guest Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Guest Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter guest's full name"
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground"
                    required
                  />
                </div>

                {/* Guest Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Guest Email{" "}
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="guest@email.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    If provided, a confirmation email will be sent to the guest
                  </p>
                </div>

                {/* Guest Phone */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Guest Phone{" "}
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="09XX XXX XXXX"
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-card rounded-xl shadow-md p-5 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Booking Details
              </h2>

              <div className="space-y-4">
                {/* Number of Guests */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Number of Guests <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={MAX_GUESTS}
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground"
                  />
                  {parseInt(numberOfGuests) > INCLUDED_GUESTS && (
                    <p className="text-xs text-warning mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Excess guest fee: +₱{EXTRA_GUEST_FEE}/guest/night for{" "}
                      {parseInt(numberOfGuests) - INCLUDED_GUESTS} extra guest
                      {parseInt(numberOfGuests) - INCLUDED_GUESTS > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Brings Pet */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bringsPet}
                      onChange={(e) => setBringsPet(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-sm text-foreground flex items-center gap-1.5">
                    <PawPrint className="w-4 h-4 text-muted-foreground" />
                    Guest brings a pet
                  </span>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Special Requests{" "}
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requests or notes..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-card rounded-xl shadow-md p-5 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                Cash Payment
              </h2>

              <div className="space-y-4">
                {/* Total to collect */}
                {pricing && (
                  <div className="bg-primary/10 border border-info/20 rounded-lg p-4">
                    <p className="text-xs text-primary font-medium uppercase tracking-wider">
                      Amount to Collect
                    </p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      ₱{totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-info mt-1">
                      Full payment • {pricing.totalNights} night
                      {pricing.totalNights !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Cash Payment Info */}
                <div className="rounded-lg p-4 border bg-success/10 border-success/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-success">
                        Cash Payment
                      </p>
                      <p className="text-xs mt-0.5 text-success">
                        Walk-in bookings are confirmed immediately as cash paid
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success text-white text-xs font-semibold rounded-full">
                      <Check className="w-3 h-3" />
                      Enabled
                    </span>
                  </div>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Walk-in bookings are always marked as confirmed and paid
                    (cash). No online payment proof is needed.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Calendar & Price Summary */}
          <div className="space-y-6">
            {/* Availability Calendar */}
            <div className="bg-card rounded-xl shadow-md p-5 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Select Dates
              </h2>
              <AvailabilityCalendar
                selectedCheckIn={selectedCheckIn}
                selectedCheckOut={selectedCheckOut}
                onDateSelect={handleDateSelect}
                minDate={todayString}
                isRescheduling={true}
                theme="light"
              />
            </div>

            {/* Price Breakdown */}
            {pricing && selectedCheckIn && selectedCheckOut && (
              <div className="bg-card rounded-xl shadow-md p-5 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Price Breakdown
                </h2>

                <div className="space-y-3">
                  {/* Dates Summary */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium text-foreground">
                      {new Date(
                        selectedCheckIn + "T00:00:00",
                      ).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at {CHECK_IN_TIME}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium text-foreground">
                      {new Date(
                        selectedCheckOut + "T00:00:00",
                      ).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at {CHECK_OUT_TIME}
                    </span>
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5" />
                        {pricing.totalNights} night
                        {pricing.totalNights !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {pricing.breakdown.weekdayNights > 0 && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground ml-5">
                          {pricing.breakdown.weekdayNights} weekday
                          {pricing.breakdown.weekdayNights !== 1 ? "s" : ""} ×
                          ₱{BASE_RATE_WEEKDAY.toLocaleString()}
                        </span>
                        <span className="text-foreground">
                          ₱{pricing.breakdown.weekdayTotal.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {pricing.breakdown.weekendNights > 0 && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground ml-5">
                          {pricing.breakdown.weekendNights} weekend/holiday
                          {pricing.breakdown.weekendNights !== 1 ? "s" : ""} ×
                          ₱{BASE_RATE_WEEKEND.toLocaleString()}
                        </span>
                        <span className="text-foreground">
                          ₱{pricing.breakdown.weekendTotal.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {pricing.excessGuestFee > 0 && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-warning ml-5">
                          Excess guest fee ({parseInt(numberOfGuests) - INCLUDED_GUESTS} ×
                          ₱{EXTRA_GUEST_FEE} × {pricing.totalNights} nights)
                        </span>
                        <span className="text-warning">
                          ₱{pricing.excessGuestFee.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        Total Amount
                      </span>
                      <span className="text-xl font-bold text-foreground">
                        ₱{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Status Preview */}
                  <div className="rounded-lg p-3 mt-2 bg-success/10">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-success/100"></div>
                      <span className="text-success">
                        Confirmed & Paid (Cash)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !guestName.trim() ||
                !selectedCheckIn ||
                !selectedCheckOut
              }
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                isSubmitting ||
                !guestName.trim() ||
                !selectedCheckIn ||
                !selectedCheckOut
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Booking...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Create Walk-in Booking
                </>
              )}
            </button>

            {/* Helper text */}
            {(!guestName.trim() || !selectedCheckIn || !selectedCheckOut) && (
              <p className="text-center text-xs text-muted-foreground">
                {!guestName.trim()
                  ? "Enter a guest name to continue"
                  : !selectedCheckIn
                    ? "Select a check-in date on the calendar"
                    : "Select a check-out date on the calendar"}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
