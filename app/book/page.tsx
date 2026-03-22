"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FaCalendarAlt,
  FaExclamationTriangle,
  FaHome,
  FaUser,
  FaSpinner,
  FaBan,
} from "react-icons/fa";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { canUserCreatePendingBooking } from "../utils/bookingUtils";
import { useToastHelpers } from "../components/Toast";
import { isMaintenanceMode } from "../utils/maintenanceMode";
import {
  cleanPhoneForDatabase,
  validatePhilippinePhone,
} from "../utils/phoneUtils";
import { BASE_RATE_WEEKDAY, BASE_RATE_WEEKEND, EXTRA_GUEST_FEE, INCLUDED_GUESTS, MAX_GUESTS, PHILIPPINE_HOLIDAYS } from "../lib/constants/pricing";
import { MAX_PENDING_BOOKINGS, MAINTENANCE_CHECK_INTERVAL_MS } from "../lib/constants";
import type { BookingBasic } from "../lib/types/booking";
import BookingFormFields from "../components/booking/BookingFormFields";
import BookingCalendar from "../components/booking/BookingCalendar";
import PriceBreakdown from "../components/booking/PriceBreakdown";
import PaymentTypeSelector from "../components/booking/PaymentTypeSelector";

function BookingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { success, error: showError, warning } = useToastHelpers();

  // All useState hooks must come before any early returns
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: "1",
    checkIn: null as Date | null,
    checkOut: null as Date | null,
    pet: false,
    request: "",
  });

  const [minDate, setMinDate] = useState<Date>(new Date());
  const [existingBookings, setExistingBookings] = useState<BookingBasic[]>([]);
  const [canCreateBooking, setCanCreateBooking] = useState(true);
  const [limitMessage, setLimitMessage] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [paymentType, setPaymentType] = useState<"half" | "full">("half"); // Default to half payment

  // Calculate 2 years from today for max booking date
  const maxBookingDate = new Date();
  maxBookingDate.setFullYear(maxBookingDate.getFullYear() + 2);

  // Auth check useEffect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Maintenance mode check useEffect
  useEffect(() => {
    let hasShownWarning = false; // Prevent multiple warnings

    const checkMaintenanceMode = async () => {
      try {
        const isActive = await isMaintenanceMode();

        // Redirect to home if maintenance is active (only show warning once)
        if (isActive && !hasShownWarning) {
          hasShownWarning = true;
          warning("Booking is currently disabled due to maintenance");
          setTimeout(() => {
            router.push("/");
          }, 2000); // Small delay to show the warning
        }
      } catch (error) {
        console.error("Error checking maintenance mode:", error);
      }
    };

    checkMaintenanceMode();

    // Check every 3 seconds but don't show multiple warnings
    const interval = setInterval(() => {
      checkMaintenanceMode();
    }, MAINTENANCE_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [router, warning]);

  // Calculate price for multi-day bookings with per-day rates
  const calculateMultiDayPrice = useCallback(
    (checkInDate: Date, checkOutDate: Date, guestCount: number = INCLUDED_GUESTS) => {
      const holidays = PHILIPPINE_HOLIDAYS;

      const nights = [];
      const current = new Date(checkInDate);
      const end = new Date(checkOutDate);

      // Calculate each night's rate
      while (current < end) {
        const day = current.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        const dateString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
        const isHoliday = (holidays as readonly string[]).includes(dateString);

        // Weekend: Friday (5), Saturday (6), Sunday (0)
        const isWeekend = day === 0 || day === 5 || day === 6;

        // Base rate per night: weekend/holiday or weekday
        const nightRate = isWeekend || isHoliday ? BASE_RATE_WEEKEND : BASE_RATE_WEEKDAY;

        nights.push({
          date: new Date(current),
          rate: nightRate,
          isWeekend: isWeekend || isHoliday,
          dayName: current.toLocaleDateString("en-US", { weekday: "short" }),
        });

        current.setDate(current.getDate() + 1);
      }

      // Calculate total base cost
      const totalBaseRate = nights.reduce((sum, night) => sum + night.rate, 0);

      // Add excess guest fee for entire stay
      const totalNights = nights.length;
      const excessGuestFee =
        guestCount > INCLUDED_GUESTS ? (guestCount - INCLUDED_GUESTS) * EXTRA_GUEST_FEE * totalNights : 0;

      return {
        nights,
        totalNights,
        totalBaseRate,
        excessGuestFee,
        totalAmount: totalBaseRate + excessGuestFee,
        breakdown: {
          weekdayNights: nights.filter((n) => !n.isWeekend).length,
          weekendNights: nights.filter((n) => n.isWeekend).length,
          weekdayTotal: nights.filter((n) => !n.isWeekend).length * BASE_RATE_WEEKDAY,
          weekendTotal: nights.filter((n) => n.isWeekend).length * BASE_RATE_WEEKEND,
        },
      };
    },
    [],
  );

  // Legacy single-day price calculation (for backward compatibility)
  const calculatePrice = useCallback(
    (checkInDate: Date, guestCount: number = INCLUDED_GUESTS) => {
      const nextDay = new Date(checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return calculateMultiDayPrice(checkInDate, nextDay, guestCount)
        .totalAmount;
    },
    [calculateMultiDayPrice],
  );

  // Data loading useEffect
  useEffect(() => {
    const today = new Date();
    // Set minimum date to today (local timezone) - avoid timezone conversion issues
    // The booking system should work with the user's local timezone for date selection
    const todayLocal = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    setMinDate(todayLocal);

    // Run all data loading operations in parallel for faster loading
    const loadAllData = async () => {
      if (!user) {
        setIsPageLoading(false);
        return;
      }

      try {
        // Execute all operations in parallel instead of sequentially
        const [bookingLimitsResult, userData, existingBookingsData] =
          await Promise.allSettled([
            // Check booking limits
            canUserCreatePendingBooking(user.id),

            // Get user data
            supabase.auth.getUser(),

            // Fetch existing bookings - but only get essential data for calendar
            supabase
              .from("bookings")
              .select("id, check_in_date, check_out_date, status")
              .in("status", ["confirmed", "pending"])
              .limit(100), // Limit to recent bookings for faster query
          ]);

        // Handle booking limits result
        if (bookingLimitsResult.status === "fulfilled") {
          setCanCreateBooking(bookingLimitsResult.value.canCreate);
          setLimitMessage(bookingLimitsResult.value.message || "");
        } else {
          console.error(
            "Error checking booking limits:",
            bookingLimitsResult.reason,
          );
          setCanCreateBooking(true); // Fallback to allow booking
        }

        // Handle user data result
        if (userData.status === "fulfilled" && userData.value.data?.user) {
          const user = userData.value.data.user;

          // Get user profile from database to get the correct phone number
          try {
            const { data: profileData, error: profileError } = await supabase
              .from("users")
              .select("full_name, email, phone")
              .eq("auth_id", user.id)
              .single();

            if (!profileError && profileData) {
              // Use database data (more reliable)
              setFormData((prevData) => ({
                ...prevData,
                name: profileData.full_name || prevData.name,
                email: profileData.email || user.email || prevData.email,
                phone: profileData.phone || prevData.phone,
              }));
            } else {
              // Fallback to auth metadata
              const phoneNumber =
                user.user_metadata?.phone ||
                user.user_metadata?.mobile ||
                user.user_metadata?.phone_number ||
                user.phone ||
                "";

              const userName = user.user_metadata?.name || "";
              const userEmail = user.email || "";

              setFormData((prevData) => ({
                ...prevData,
                name: userName || prevData.name,
                email: userEmail || prevData.email,
                phone: phoneNumber || prevData.phone,
              }));
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
            // Fallback to auth metadata
            const phoneNumber =
              user.user_metadata?.phone ||
              user.user_metadata?.mobile ||
              user.user_metadata?.phone_number ||
              user.phone ||
              "";

            const userName = user.user_metadata?.name || "";
            const userEmail = user.email || "";

            setFormData((prevData) => ({
              ...prevData,
              name: userName || prevData.name,
              email: userEmail || prevData.email,
              phone: phoneNumber || prevData.phone,
            }));
          }
        } else {
          console.error(
            "Error loading user data:",
            userData.status === "rejected" ? userData.reason : "No user data",
          );
        }

        // Handle existing bookings result
        if (existingBookingsData.status === "fulfilled") {
          setExistingBookings(existingBookingsData.value.data || []);
        } else {
          console.error(
            "Error fetching bookings:",
            existingBookingsData.reason,
          );
          setExistingBookings([]); // Fallback to empty array
        }
      } catch (error) {
        console.error("Error loading booking page data:", error);
        // Continue with defaults - don't block the UI
      } finally {
        setIsPageLoading(false); // Always stop loading indicator
      }
    };

    loadAllData();
  }, [user]);

  // Add pricing breakdown state
  const [pricingBreakdown, setPricingBreakdown] = useState<{
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
  } | null>(null);

  // Update price when check-in/check-out dates or guest count changes
  useEffect(() => {
    if (formData.checkIn && formData.checkOut && formData.guests) {
      const guestCount = parseInt(formData.guests) || INCLUDED_GUESTS;
      const pricing = calculateMultiDayPrice(
        formData.checkIn,
        formData.checkOut,
        guestCount,
      );
      setEstimatedPrice(pricing.totalAmount);
      setPricingBreakdown(pricing);
    } else if (formData.checkIn && formData.checkOut) {
      const pricing = calculateMultiDayPrice(
        formData.checkIn,
        formData.checkOut,
        INCLUDED_GUESTS,
      );
      setEstimatedPrice(pricing.totalAmount);
      setPricingBreakdown(pricing);
    } else if (formData.checkIn && formData.guests) {
      // Single day fallback (if no checkout selected yet)
      const guestCount = parseInt(formData.guests) || INCLUDED_GUESTS;
      const price = calculatePrice(formData.checkIn, guestCount);
      setEstimatedPrice(price);
      setPricingBreakdown(null);
    } else if (formData.checkIn) {
      // Single day fallback (if no checkout selected yet)
      const price = calculatePrice(formData.checkIn, INCLUDED_GUESTS);
      setEstimatedPrice(price);
      setPricingBreakdown(null);
    } else {
      setEstimatedPrice(null);
      setPricingBreakdown(null);
    }
  }, [
    formData.checkIn,
    formData.checkOut,
    formData.guests,
    calculateMultiDayPrice,
    calculatePrice,
  ]);

  // Show loading if auth is still loading or page is loading data
  if (loading || isPageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">
            {loading ? "Loading..." : "Preparing booking form..."}
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  // Enhanced multi-day conflict detection with detailed messaging
  const checkBookingConflict = (
    checkInDate: Date | null,
    checkOutDate: Date | null,
  ) => {
    if (!checkInDate || !checkOutDate)
      return { hasConflict: false, message: "" };

    // Use local date formatting to avoid timezone issues
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const newCheckInDate = formatLocalDate(checkInDate);
    const newCheckOutDate = formatLocalDate(checkOutDate);

    // Filter confirmed and pending bookings for conflict checking
    const activeBookings = existingBookings.filter(
      (booking) =>
        booking.status === "confirmed" || booking.status === "pending",
    );

    // Generate all dates in the new booking range (excluding checkout day)
    const newBookingDates: string[] = [];
    const current = new Date(checkInDate);
    const end = new Date(checkOutDate);

    while (current < end) {
      newBookingDates.push(formatLocalDate(current));
      current.setDate(current.getDate() + 1);
    }

    // 1. Check for exact same date range (prevent double booking)
    for (const booking of activeBookings) {
      const existingCheckIn = new Date(booking.check_in_date);
      const existingCheckOut = new Date(booking.check_out_date);
      const existingCheckInDate = formatLocalDate(existingCheckIn);
      const existingCheckOutDate = formatLocalDate(existingCheckOut);

      if (
        newCheckInDate === existingCheckInDate &&
        newCheckOutDate === existingCheckOutDate
      ) {
        const checkInFormatted = checkInDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const checkOutFormatted = checkOutDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        return {
          hasConflict: true,
          message: `These exact dates (${checkInFormatted} to ${checkOutFormatted}) are already booked. Please choose different dates.`,
        };
      }
    }

    // 2. Detailed multi-day overlap detection
    const conflictingBookings: Array<{
      booking: BookingBasic;
      conflictDates: string[];
    }> = [];

    for (const booking of activeBookings) {
      const existingCheckIn = new Date(booking.check_in_date);
      const existingCheckOut = new Date(booking.check_out_date);

      // Generate existing booking dates (excluding checkout day)
      const existingDates: string[] = [];
      const existingCurrent = new Date(existingCheckIn);
      const existingEnd = new Date(existingCheckOut);

      while (existingCurrent < existingEnd) {
        existingDates.push(formatLocalDate(existingCurrent));
        existingCurrent.setDate(existingCurrent.getDate() + 1);
      }

      // Find overlapping dates
      const overlapping = newBookingDates.filter((date) =>
        existingDates.includes(date),
      );

      if (overlapping.length > 0) {
        conflictingBookings.push({
          booking,
          conflictDates: overlapping,
        });
      }
    }

    // If there are conflicts, create detailed message
    if (conflictingBookings.length > 0) {
      const firstConflict = conflictingBookings[0];
      const conflictStart = new Date(firstConflict.conflictDates[0]);
      const conflictEnd = new Date(
        firstConflict.conflictDates[firstConflict.conflictDates.length - 1],
      );
      conflictEnd.setDate(conflictEnd.getDate() + 1); // Add one day since we want the end date

      const existingCheckIn = new Date(firstConflict.booking.check_in_date);
      const existingCheckOut = new Date(firstConflict.booking.check_out_date);

      return {
        hasConflict: true,
        message: `Your booking conflicts with an existing reservation. The dates ${conflictStart.toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" },
        )} to ${conflictEnd.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} overlap with a booking from ${existingCheckIn.toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" },
        )} to ${existingCheckOut.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}. Please choose different dates or adjust your stay duration.`,
      };
    }

    // 3. Check check-in capacity (max 2 check-ins per day) - enhanced for multi-day
    const checkInCounts = new Map<string, number>();

    activeBookings.forEach((booking) => {
      const existingCheckIn = new Date(booking.check_in_date);
      const existingCheckInDate = formatLocalDate(existingCheckIn);

      const prevCount = checkInCounts.get(existingCheckInDate) || 0;
      checkInCounts.set(existingCheckInDate, prevCount + 1);
    });

    const currentCheckIns = checkInCounts.get(newCheckInDate) || 0;

    if (currentCheckIns >= 2) {
      const checkInFormatted = checkInDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      return {
        hasConflict: true,
        message: `${checkInFormatted} already has 2 check-ins scheduled (full capacity). Please choose a different check-in date.`,
      };
    }

    return { hasConflict: false, message: "" }; // No conflicts found
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, type, value } = e.target;

    // Prevent changes to read-only profile fields for security
    const readOnlyFields = ["name", "email", "phone"];
    if (readOnlyFields.includes(name)) {
      console.warn(`Attempted to modify read-only field: ${name}`);
      return; // Block any changes to profile fields
    }

    let fieldValue: string | boolean = value;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      fieldValue = e.target.checked;
    }

    setFormData({ ...formData, [name]: fieldValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showError("Authentication Required", "Please log in to make a booking");
      router.push("/auth");
      setIsSubmitting(false);
      return;
    }

    // Check if user can create pending bookings (enforce limit)
    if (!canCreateBooking) {
      warning(
        "Booking Limit Reached",
        limitMessage ||
          `You have reached the maximum number of pending bookings (${MAX_PENDING_BOOKINGS}). Please wait for confirmation or cancel existing pending bookings.`,
      );
      setIsSubmitting(false);
      return;
    }

    // Validate all required fields (name and email are auto-populated from profile)
    if (!formData.name.trim()) {
      showError(
        "Profile Information Missing",
        "Your profile name is required. Please update your profile first.",
      );
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      showError(
        "Profile Information Missing",
        "Your profile email is required. Please update your profile first.",
      );
      setIsSubmitting(false);
      return;
    }

    if (!formData.guests) {
      showError("Missing Information", "Please select number of guests");
      setIsSubmitting(false);
      return;
    }

    // Validate guest count doesn't exceed capacity
    if (parseInt(formData.guests) > MAX_GUESTS) {
      showError(
        "Guest Limit Exceeded",
        `Maximum capacity is ${MAX_GUESTS} guests. Please contact us directly for larger events.`,
      );
      setIsSubmitting(false);
      return;
    }

    // Validate dates are selected
    if (!formData.checkIn || !formData.checkOut) {
      showError(
        "Missing Dates",
        "Please select both check-in and check-out dates",
      );
      setIsSubmitting(false);
      return;
    }

    // Validate check-out is after check-in
    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      showError("Invalid Dates", "Check-out date must be after check-in date");
      setIsSubmitting(false);
      return;
    }

    // Validate maximum stay duration (30 days)
    const daysDifference = Math.ceil(
      (new Date(formData.checkOut).getTime() -
        new Date(formData.checkIn).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysDifference > 30) {
      showError(
        "Stay Too Long",
        "Maximum stay is 30 nights. For longer stays, please contact us directly.",
      );
      setIsSubmitting(false);
      return;
    }

    // Validate minimum stay duration (1 night)
    if (daysDifference < 1) {
      showError(
        "Invalid Stay",
        "Minimum stay is 1 night. Please select at least one night.",
      );
      setIsSubmitting(false);
      return;
    }

    // Validate Philippine phone number if provided
    if (formData.phone.trim()) {
      if (!validatePhilippinePhone(formData.phone.trim())) {
        showError(
          "Invalid Phone Number",
          "Please enter a valid Philippine mobile number (e.g. 09171234567 or +639171234567).",
        );
        setIsSubmitting(false);
        return;
      }
    }

    // Check for booking conflicts
    const conflictCheck = checkBookingConflict(
      formData.checkIn,
      formData.checkOut,
    );
    if (conflictCheck.hasConflict) {
      showError("Booking Conflict", conflictCheck.message);
      setIsSubmitting(false);
      return;
    }

    // Calculate dynamic price based on multi-day stay and guest count
    const pricing = calculateMultiDayPrice(
      formData.checkIn!,
      formData.checkOut!,
      parseInt(formData.guests),
    );
    const totalAmount = pricing.totalAmount;
    const paymentAmount =
      paymentType === "half" ? Math.round(totalAmount * 0.5) : totalAmount;

    // Fix timezone issue - use local date strings instead of UTC
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const checkInDateTime = `${formatLocalDate(formData.checkIn!)}T15:00:00`; // 3 PM
    const checkOutDateTime = `${formatLocalDate(formData.checkOut!)}T13:00:00`; // 1 PM

    const bookingData = {
      user_id: user.id,
      guest_name: formData.name.trim(),
      guest_email: formData.email.trim(),
      guest_phone: formData.phone.trim()
        ? cleanPhoneForDatabase(formData.phone.trim())
        : null,
      number_of_guests: parseInt(formData.guests),
      check_in_date: checkInDateTime,
      check_out_date: checkOutDateTime,
      brings_pet: formData.pet,
      special_requests: formData.request.trim() || null,
      status: "pending",
      total_amount: totalAmount, // Dynamic pricing based on date
      payment_type: paymentType, // 'half' or 'full'
      payment_amount: paymentAmount, // Amount to be paid now
    };

    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        setIsSubmitting(false);
        showError(
          "Booking Failed",
          `Error creating booking: ${
            error.message || "Unknown error"
          }. Please try again.`,
        );
      } else {
        // Booking created successfully - redirect to manual payment upload

        // Show success message
        success("Booking Created!", "Redirecting to payment upload...");

        // Multiple redirect attempts to ensure reliability
        const uploadUrl = `/upload-payment-proof?bookingId=${data.id}`;

        try {
          // Primary redirect method
          router.push(uploadUrl);
        } catch (redirectError) {
          console.error("Primary redirect failed:", redirectError);

          // Fallback redirect method
          setTimeout(() => {
            try {
              router.replace(uploadUrl);
            } catch (fallbackError) {
              console.error("Fallback redirect failed:", fallbackError);
              // Last resort - use window.location
              window.location.href = uploadUrl;
            }
          }, 500);
        }

        // Set submitting to false after redirect attempt
        setTimeout(() => {
          setIsSubmitting(false);
        }, 1000);

        // Send confirmation emails in the background (non-blocking)
        const sendEmailInBackground = async () => {
          try {
            const emailBookingDetails = {
              bookingId: data.id.toString(),
              guestName: bookingData.guest_name,
              checkIn: formData.checkIn!.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              checkOut: formData.checkOut!.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              guests: bookingData.number_of_guests,
              totalAmount: bookingData.total_amount,
              email: bookingData.guest_email,
              paymentType: paymentType,
            };

            const { data: { session: emailSession } } = await supabase.auth.getSession();
            const emailResponse = await fetch(
              "/api/email/booking-confirmation",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${emailSession?.access_token}`,
                },
                body: JSON.stringify({
                  bookingDetails: emailBookingDetails,
                  phoneNumber: bookingData.guest_phone, // Add phone for SMS
                }),
              },
            );

            if (!emailResponse.ok) {
              console.warn(
                "Email sending failed, but booking was created successfully",
              );
            }
          } catch (emailError) {
            console.warn("Email service error:", emailError);
            // Email failure doesn't affect user experience since booking is already confirmed
          }
        };

        // Fire and forget - email sending won't block the UI
        sendEmailInBackground();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setIsSubmitting(false);
      showError(
        "Unexpected Error",
        "Unexpected error creating booking. Please try again.",
      );
    }
  };

  return (
    <>
      {/* Navigation Bar */}
      <div className="sticky top-0 bg-background/90 backdrop-blur-sm border-b border-border z-20">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-muted hover:bg-secondary rounded-lg transition-colors"
              >
                <FaHome className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 relative">
                    <Image
                      src="/logo.png"
                      alt="Kampo Ibayo Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">Kampo Ibayo</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Booking Portal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-muted hover:bg-secondary rounded-lg transition-colors"
              >
                <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </Link>
              <div className="text-xs sm:text-sm text-right">
                {loading ? (
                  <span className="inline-block bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
                    ● Loading...
                  </span>
                ) : user ? (
                  <span className="inline-block bg-success/20 text-success px-2 py-1 rounded-full text-xs font-semibold border border-success/30">
                    ● Signed In
                  </span>
                ) : (
                  <span className="inline-block bg-warning/20 text-warning px-2 py-1 rounded-full text-xs font-semibold border border-warning/30">
                    ● Guest
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="min-h-screen bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

          {/* Page Header */}
          <div className="mb-4">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Book Your Escape
            </h1>
            <p className="text-muted-foreground mt-1">
              Experience luxury and comfort at Kampo Ibayo Resort
            </p>
          </div>

          {/* Booking Limit Warning */}
          {!canCreateBooking && (
            <div className="mb-5 p-4 bg-destructive/10 border border-destructive/40 rounded-xl">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-destructive text-sm font-medium">{limitMessage}</p>
              </div>
            </div>
          )}

          {/* Two-panel landscape form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

            {/* Left panel — Guest details + payment choice */}
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
                <BookingFormFields
                  formData={formData}
                  setFormData={setFormData}
                  handleChange={handleChange}
                />
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
                <PaymentTypeSelector
                  paymentType={paymentType}
                  setPaymentType={setPaymentType}
                  estimatedPrice={estimatedPrice}
                />
              </div>
            </div>

            {/* Right panel — Calendar + Price + Submit (sticky) */}
            <div className="space-y-3 md:sticky md:top-20">
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FaCalendarAlt className="w-4 h-4 text-primary flex-shrink-0" />
                  <h2 className="text-lg font-bold text-foreground">Select Your Dates</h2>
                </div>
                <BookingCalendar
                  formData={formData}
                  setFormData={setFormData}
                  minDate={minDate}
                  maxBookingDate={maxBookingDate}
                  existingBookings={existingBookings}
                  pricingBreakdown={pricingBreakdown}
                />
              </div>

              <PriceBreakdown
                formData={formData}
                estimatedPrice={estimatedPrice}
                pricingBreakdown={pricingBreakdown}
                paymentType={paymentType}
              />

              {/* Submit — inside sticky right panel, always visible */}
              <div>
                <button
                  type="submit"
                  disabled={
                    !canCreateBooking ||
                    isSubmitting ||
                    (estimatedPrice !== null && estimatedPrice === 0)
                  }
                  className={`w-full font-bold py-3.5 rounded-2xl transition-all duration-200 text-base shadow-lg ${
                    canCreateBooking && !isSubmitting && estimatedPrice !== 0
                      ? "bg-primary text-white hover:bg-primary/90 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin w-4 h-4" />
                      <span>Processing Reservation...</span>
                    </div>
                  ) : canCreateBooking ? (
                    estimatedPrice && estimatedPrice > 0 ? (
                      paymentType === "half"
                        ? `Pay Down Payment — ₱${Math.round(estimatedPrice * 0.5).toLocaleString()}`
                        : `Pay Full Amount — ₱${estimatedPrice.toLocaleString()}`
                    ) : estimatedPrice === 0 ? (
                      <span className="flex items-center justify-center gap-2">
                        <FaExclamationTriangle className="w-4 h-4" /> Select Valid Dates
                      </span>
                    ) : (
                      "Complete Booking Details"
                    )
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FaBan className="w-4 h-4" /> Booking Limit Reached
                    </span>
                  )}
                </button>
                {estimatedPrice !== null && estimatedPrice > 0 && canCreateBooking && !isSubmitting && (
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    By reserving, you agree to our booking terms and conditions
                  </p>
                )}
                {isSubmitting && (
                  <p className="text-center text-xs text-primary mt-2 animate-pulse flex items-center justify-center gap-2">
                    <FaSpinner className="w-3 h-3 animate-spin" /> Securing your reservation... Please don&apos;t close this page
                  </p>
                )}
              </div>
            </div>

          </form>
        </div>
      </main>
    </>
  );
}

// Export the component directly - auth is handled inside
export default BookingPage;
