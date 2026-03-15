"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToastHelpers } from "../../../components/Toast";
import AvailabilityCalendar from "../../../components/AvailabilityCalendar";
import {
  validatePhilippinePhone,
  cleanPhoneForDatabase,
} from "../../../utils/phoneUtils";

export default function WalkInBookingPage() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const { success, error: showError } = useToastHelpers();

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("15");
  const [bringsPet, setBringsPet] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");

  // Date selection state
  const [selectedCheckIn, setSelectedCheckIn] = useState("");
  const [selectedCheckOut, setSelectedCheckOut] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Today's date as YYYY-MM-DD string for calendar minDate (block past dates)
  const todayString = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // Auth guard
  useEffect(() => {
    if (
      !authLoading &&
      (!user || (userRole !== "admin" && userRole !== "staff"))
    ) {
      router.replace("/admin");
    }
  }, [user, userRole, authLoading, router]);

  // Philippine holidays 2024-2027
  const holidays = [
    "2024-12-25",
    "2024-12-30",
    "2024-12-31",
    "2025-01-01",
    "2025-02-14",
    "2025-04-17",
    "2025-04-18",
    "2025-04-19",
    "2025-06-12",
    "2025-08-25",
    "2025-11-01",
    "2025-11-02",
    "2025-11-30",
    "2025-12-25",
    "2025-12-30",
    "2025-12-31",
    "2026-01-01",
    "2026-02-14",
    "2026-04-02",
    "2026-04-03",
    "2026-04-04",
    "2026-06-12",
    "2026-08-31",
    "2026-11-01",
    "2026-11-02",
    "2026-11-30",
    "2026-12-25",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-02-14",
    "2027-03-25",
    "2027-03-26",
    "2027-03-27",
    "2027-06-12",
    "2027-08-30",
    "2027-11-01",
    "2027-11-02",
    "2027-11-30",
    "2027-12-25",
    "2027-12-30",
    "2027-12-31",
  ];

  // Calculate price for multi-day bookings with per-day rates
  const calculateMultiDayPrice = useCallback(
    (checkIn: string, checkOut: string, guestCount: number = 15) => {
      const checkInDate = new Date(checkIn + "T00:00:00");
      const checkOutDate = new Date(checkOut + "T00:00:00");

      const nights: {
        date: Date;
        rate: number;
        isWeekend: boolean;
        dayName: string;
      }[] = [];
      const current = new Date(checkInDate);

      while (current < checkOutDate) {
        const day = current.getDay();
        const dateString = current.toISOString().split("T")[0];
        const isHoliday = holidays.includes(dateString);
        const isWeekend = day === 0 || day === 5 || day === 6;
        const nightRate = isWeekend || isHoliday ? 12000 : 9000;

        nights.push({
          date: new Date(current),
          rate: nightRate,
          isWeekend: isWeekend || isHoliday,
          dayName: current.toLocaleDateString("en-US", { weekday: "short" }),
        });

        current.setDate(current.getDate() + 1);
      }

      const totalBaseRate = nights.reduce((sum, night) => sum + night.rate, 0);
      const totalNights = nights.length;
      const excessGuestFee =
        guestCount > 15 ? (guestCount - 15) * 300 * totalNights : 0;

      return {
        nights,
        totalNights,
        totalBaseRate,
        excessGuestFee,
        totalAmount: totalBaseRate + excessGuestFee,
        breakdown: {
          weekdayNights: nights.filter((n) => !n.isWeekend).length,
          weekendNights: nights.filter((n) => n.isWeekend).length,
          weekdayTotal: nights.filter((n) => !n.isWeekend).length * 9000,
          weekendTotal: nights.filter((n) => n.isWeekend).length * 12000,
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Handle date selection from calendar
  const handleDateSelect = (checkIn: string, checkOut: string) => {
    setSelectedCheckIn(checkIn);
    setSelectedCheckOut(checkOut);
  };

  // Compute pricing
  const pricing =
    selectedCheckIn && selectedCheckOut
      ? calculateMultiDayPrice(
          selectedCheckIn,
          selectedCheckOut,
          parseInt(numberOfGuests) || 15,
        )
      : null;

  const totalAmount = pricing?.totalAmount || 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Auth check
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        showError(
          "Authentication Error",
          "You must be logged in to create a booking.",
        );
        setIsSubmitting(false);
        return;
      }

      // Validate required fields
      if (!guestName.trim()) {
        showError("Missing Information", "Guest name is required.");
        setIsSubmitting(false);
        return;
      }

      // Validate email format if provided
      if (guestEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(guestEmail.trim())) {
          showError(
            "Invalid Email",
            "Please enter a valid email address (e.g. name@example.com).",
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Validate Philippine phone number if provided
      if (guestPhone.trim()) {
        if (!validatePhilippinePhone(guestPhone.trim())) {
          showError(
            "Invalid Phone Number",
            "Please enter a valid Philippine mobile number (e.g. 09171234567 or +639171234567).",
          );
          setIsSubmitting(false);
          return;
        }
      }

      if (!selectedCheckIn || !selectedCheckOut) {
        showError(
          "Missing Dates",
          "Please select both check-in and check-out dates on the calendar.",
        );
        setIsSubmitting(false);
        return;
      }

      const guestCount = parseInt(numberOfGuests) || 15;
      if (guestCount < 1 || guestCount > 50) {
        showError("Invalid Guests", "Guest count must be between 1 and 50.");
        setIsSubmitting(false);
        return;
      }

      // Validate dates
      const checkInDate = new Date(selectedCheckIn + "T00:00:00");
      const checkOutDate = new Date(selectedCheckOut + "T00:00:00");
      const daysDiff = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysDiff < 1) {
        showError("Invalid Dates", "Check-out must be after check-in.");
        setIsSubmitting(false);
        return;
      }

      if (daysDiff > 30) {
        showError("Stay Too Long", "Maximum stay is 30 nights.");
        setIsSubmitting(false);
        return;
      }

      // Check for booking conflicts
      const { data: conflictingBookings, error: conflictError } = await supabase
        .from("bookings")
        .select("id, check_in_date, check_out_date, status")
        .in("status", ["confirmed", "pending"])
        .or(
          `and(check_in_date.lt.${selectedCheckOut}T13:00:00,check_out_date.gt.${selectedCheckIn}T15:00:00)`,
        );

      if (conflictError) {
        console.error("Conflict check error:", conflictError);
      }

      if (conflictingBookings && conflictingBookings.length > 0) {
        // Check actual date overlap more carefully
        const hasRealConflict = conflictingBookings.some((booking) => {
          const existCheckIn = booking.check_in_date.split("T")[0];
          const existCheckOut = booking.check_out_date.split("T")[0];
          // Overlap if new check-in is before existing check-out AND new check-out is after existing check-in
          return (
            selectedCheckIn < existCheckOut && selectedCheckOut > existCheckIn
          );
        });

        if (hasRealConflict) {
          showError(
            "Booking Conflict",
            "The selected dates conflict with an existing reservation. Please choose different dates.",
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Build booking data
      const checkInDateTime = `${selectedCheckIn}T15:00:00`;
      const checkOutDateTime = `${selectedCheckOut}T13:00:00`;

      const walkInNote = specialRequests.trim()
        ? `[WALK-IN] ${specialRequests.trim()}`
        : "[WALK-IN]";

      const bookingData = {
        user_id: currentUser.id,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim() || "walkin@kampoibayo.com",
        guest_phone: guestPhone.trim()
          ? cleanPhoneForDatabase(guestPhone.trim())
          : null,
        number_of_guests: guestCount,
        check_in_date: checkInDateTime,
        check_out_date: checkOutDateTime,
        brings_pet: bringsPet,
        special_requests: walkInNote,
        status: "confirmed",
        total_amount: totalAmount,
        payment_type: "full" as const,
        payment_amount: totalAmount,
        payment_status: "paid",
      };

      const { data, error } = await supabase
        .from("bookings")
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error("Booking creation error:", error);
        showError("Booking Failed", `Error: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      // Optionally send confirmation email if guest email was provided
      if (guestEmail.trim() && data) {
        try {
          const { data: { session: emailSession } } = await supabase.auth.getSession();
          await fetch("/api/email/booking-confirmation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${emailSession?.access_token}`,
            },
            body: JSON.stringify({
              bookingDetails: {
                bookingId: data.id.toString(),
                guestName: guestName.trim(),
                checkIn: selectedCheckIn,
                checkOut: selectedCheckOut,
                guests: guestCount,
                totalAmount: totalAmount,
                email: guestEmail.trim(),
              },
              phoneNumber: guestPhone.trim() || undefined,
            }),
          });
        } catch (emailError) {
          console.warn("Email notification failed (non-blocking):", emailError);
        }
      }

      success(
        "Walk-in Booking Created!",
        `Booking for ${guestName.trim()} has been confirmed (cash paid).`,
      );

      // Redirect back to bookings list
      setTimeout(() => {
        router.push("/admin/bookings");
      }, 1000);
    } catch (error) {
      console.error("Walk-in booking error:", error);
      showError("Error", "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Create Walk-in Booking
            </h1>
            <p className="text-sm text-gray-500">
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
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Guest Information
              </h2>

              <div className="space-y-4">
                {/* Guest Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter guest's full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    required
                  />
                </div>

                {/* Guest Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Email{" "}
                    <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="guest@email.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    If provided, a confirmation email will be sent to the guest
                  </p>
                </div>

                {/* Guest Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Phone{" "}
                    <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="09XX XXX XXXX"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Booking Details
              </h2>

              <div className="space-y-4">
                {/* Number of Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  />
                  {parseInt(numberOfGuests) > 15 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Excess guest fee: +₱300/guest/night for{" "}
                      {parseInt(numberOfGuests) - 15} extra guest
                      {parseInt(numberOfGuests) - 15 > 1 ? "s" : ""}
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-sm text-gray-700 flex items-center gap-1.5">
                    <PawPrint className="w-4 h-4 text-gray-400" />
                    Guest brings a pet
                  </span>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requests{" "}
                    <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requests or notes..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-blue-600" />
                Cash Payment
              </h2>

              <div className="space-y-4">
                {/* Total to collect */}
                {pricing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">
                      Amount to Collect
                    </p>
                    <p className="text-2xl font-bold text-blue-800 mt-1">
                      ₱{totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      Full payment • {pricing.totalNights} night
                      {pricing.totalNights !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Cash Payment Info */}
                <div className="rounded-lg p-4 border bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Cash Payment
                      </p>
                      <p className="text-xs mt-0.5 text-green-600">
                        Walk-in bookings are confirmed immediately as cash paid
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                      <Check className="w-3 h-3" />
                      Enabled
                    </span>
                  </div>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 text-xs text-gray-500">
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
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
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
              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Price Breakdown
                </h2>

                <div className="space-y-3">
                  {/* Dates Summary */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Check-in</span>
                    <span className="font-medium text-gray-800">
                      {new Date(
                        selectedCheckIn + "T00:00:00",
                      ).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at 3:00 PM
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Check-out</span>
                    <span className="font-medium text-gray-800">
                      {new Date(
                        selectedCheckOut + "T00:00:00",
                      ).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at 1:00 PM
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5" />
                        {pricing.totalNights} night
                        {pricing.totalNights !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {pricing.breakdown.weekdayNights > 0 && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-500 ml-5">
                          {pricing.breakdown.weekdayNights} weekday
                          {pricing.breakdown.weekdayNights !== 1 ? "s" : ""} ×
                          ₱9,000
                        </span>
                        <span className="text-gray-700">
                          ₱{pricing.breakdown.weekdayTotal.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {pricing.breakdown.weekendNights > 0 && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-500 ml-5">
                          {pricing.breakdown.weekendNights} weekend/holiday
                          {pricing.breakdown.weekendNights !== 1 ? "s" : ""} ×
                          ₱12,000
                        </span>
                        <span className="text-gray-700">
                          ₱{pricing.breakdown.weekendTotal.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {pricing.excessGuestFee > 0 && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-amber-600 ml-5">
                          Excess guest fee ({parseInt(numberOfGuests) - 15} ×
                          ₱300 × {pricing.totalNights} nights)
                        </span>
                        <span className="text-amber-700">
                          ₱{pricing.excessGuestFee.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">
                        Total Amount
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        ₱{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Status Preview */}
                  <div className="rounded-lg p-3 mt-2 bg-green-50">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      <span className="text-green-700">
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
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
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
              <p className="text-center text-xs text-gray-400">
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
