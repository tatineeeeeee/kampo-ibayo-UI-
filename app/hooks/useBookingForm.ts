"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { canUserCreatePendingBooking } from "../utils/bookingUtils";
import { useToastHelpers } from "../components/Toast";
import { isMaintenanceMode } from "../utils/maintenanceMode";
import {
  cleanPhoneForDatabase,
  validatePhilippinePhone,
} from "../utils/phoneUtils";
import {
  BASE_RATE_WEEKDAY,
  BASE_RATE_WEEKEND,
  EXTRA_GUEST_FEE,
  INCLUDED_GUESTS,
  MAX_GUESTS,
  PHILIPPINE_HOLIDAYS,
} from "../lib/constants/pricing";
import {
  MAX_PENDING_BOOKINGS,
  MAINTENANCE_CHECK_INTERVAL_MS,
} from "../lib/constants";
import type { BookingBasic } from "../lib/types/booking";

interface FormData {
  name: string;
  email: string;
  phone: string;
  guests: string;
  checkIn: Date | null;
  checkOut: Date | null;
  pet: boolean;
  request: string;
}

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

export interface UseBookingFormReturn {
  user: ReturnType<typeof useAuth>["user"];
  loading: boolean;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  minDate: Date;
  maxBookingDate: Date;
  existingBookings: BookingBasic[];
  canCreateBooking: boolean;
  limitMessage: string;
  estimatedPrice: number | null;
  isSubmitting: boolean;
  isPageLoading: boolean;
  paymentType: "half" | "full";
  setPaymentType: React.Dispatch<React.SetStateAction<"half" | "full">>;
  pricingBreakdown: PricingBreakdown | null;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useBookingForm(): UseBookingFormReturn {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { success, error: showError, warning } = useToastHelpers();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    guests: "1",
    checkIn: null,
    checkOut: null,
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
  const [paymentType, setPaymentType] = useState<"half" | "full">("half");
  const [pricingBreakdown, setPricingBreakdown] =
    useState<PricingBreakdown | null>(null);

  const maxBookingDate = new Date();
  maxBookingDate.setFullYear(maxBookingDate.getFullYear() + 2);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    let hasShownWarning = false;

    const checkMaintenanceMode = async () => {
      try {
        const isActive = await isMaintenanceMode();
        if (isActive && !hasShownWarning) {
          hasShownWarning = true;
          warning("Booking is currently disabled due to maintenance");
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking maintenance mode:", error);
      }
    };

    checkMaintenanceMode();

    const interval = setInterval(() => {
      checkMaintenanceMode();
    }, MAINTENANCE_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [router, warning]);

  const calculateMultiDayPrice = useCallback(
    (
      checkInDate: Date,
      checkOutDate: Date,
      guestCount: number = INCLUDED_GUESTS,
    ) => {
      const holidays = PHILIPPINE_HOLIDAYS;
      const nights = [];
      const current = new Date(checkInDate);
      const end = new Date(checkOutDate);

      while (current < end) {
        const day = current.getDay();
        const dateString = `${current.getFullYear()}-${String(
          current.getMonth() + 1,
        ).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
        const isHoliday = (holidays as readonly string[]).includes(dateString);
        const isWeekend = day === 0 || day === 5 || day === 6;
        const nightRate =
          isWeekend || isHoliday ? BASE_RATE_WEEKEND : BASE_RATE_WEEKDAY;

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
          weekdayNights: nights.filter((night) => !night.isWeekend).length,
          weekendNights: nights.filter((night) => night.isWeekend).length,
          weekdayTotal:
            nights.filter((night) => !night.isWeekend).length *
            BASE_RATE_WEEKDAY,
          weekendTotal:
            nights.filter((night) => night.isWeekend).length *
            BASE_RATE_WEEKEND,
        },
      };
    },
    [],
  );

  const calculatePrice = useCallback(
    (checkInDate: Date, guestCount: number = INCLUDED_GUESTS) => {
      const nextDay = new Date(checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return calculateMultiDayPrice(checkInDate, nextDay, guestCount)
        .totalAmount;
    },
    [calculateMultiDayPrice],
  );

  useEffect(() => {
    const today = new Date();
    const todayLocal = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    setMinDate(todayLocal);

    const loadAllData = async () => {
      if (!user) {
        setIsPageLoading(false);
        return;
      }

      try {
        const [bookingLimitsResult, userData, existingBookingsData] =
          await Promise.allSettled([
            canUserCreatePendingBooking(user.id),
            supabase.auth.getUser(),
            supabase
              .from("bookings")
              .select("id, check_in_date, check_out_date, status")
              .in("status", ["confirmed", "pending"])
              .limit(100),
          ]);

        if (bookingLimitsResult.status === "fulfilled") {
          setCanCreateBooking(bookingLimitsResult.value.canCreate);
          setLimitMessage(bookingLimitsResult.value.message || "");
        } else {
          console.error(
            "Error checking booking limits:",
            bookingLimitsResult.reason,
          );
          setCanCreateBooking(true);
        }

        if (userData.status === "fulfilled" && userData.value.data?.user) {
          const authUser = userData.value.data.user;

          try {
            const { data: profileData, error: profileError } = await supabase
              .from("users")
              .select("full_name, email, phone")
              .eq("auth_id", authUser.id)
              .single();

            if (!profileError && profileData) {
              setFormData((previous) => ({
                ...previous,
                name: profileData.full_name || previous.name,
                email: profileData.email || authUser.email || previous.email,
                phone: profileData.phone || previous.phone,
              }));
            } else {
              const phoneNumber =
                authUser.user_metadata?.phone ||
                authUser.user_metadata?.mobile ||
                authUser.user_metadata?.phone_number ||
                authUser.phone ||
                "";

              setFormData((previous) => ({
                ...previous,
                name: authUser.user_metadata?.name || previous.name,
                email: authUser.email || previous.email,
                phone: phoneNumber || previous.phone,
              }));
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            const phoneNumber =
              authUser.user_metadata?.phone ||
              authUser.user_metadata?.mobile ||
              authUser.user_metadata?.phone_number ||
              authUser.phone ||
              "";

            setFormData((previous) => ({
              ...previous,
              name: authUser.user_metadata?.name || previous.name,
              email: authUser.email || previous.email,
              phone: phoneNumber || previous.phone,
            }));
          }
        }

        if (existingBookingsData.status === "fulfilled") {
          setExistingBookings(existingBookingsData.value.data || []);
        } else {
          console.error(
            "Error fetching bookings:",
            existingBookingsData.reason,
          );
          setExistingBookings([]);
        }
      } catch (error) {
        console.error("Error loading booking page data:", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    loadAllData();
  }, [user]);

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
      return;
    }

    if (formData.checkIn && formData.checkOut) {
      const pricing = calculateMultiDayPrice(
        formData.checkIn,
        formData.checkOut,
        INCLUDED_GUESTS,
      );
      setEstimatedPrice(pricing.totalAmount);
      setPricingBreakdown(pricing);
      return;
    }

    if (formData.checkIn && formData.guests) {
      const guestCount = parseInt(formData.guests) || INCLUDED_GUESTS;
      const price = calculatePrice(formData.checkIn, guestCount);
      setEstimatedPrice(price);
      setPricingBreakdown(null);
      return;
    }

    if (formData.checkIn) {
      const price = calculatePrice(formData.checkIn, INCLUDED_GUESTS);
      setEstimatedPrice(price);
      setPricingBreakdown(null);
      return;
    }

    setEstimatedPrice(null);
    setPricingBreakdown(null);
  }, [
    formData.checkIn,
    formData.checkOut,
    formData.guests,
    calculateMultiDayPrice,
    calculatePrice,
  ]);

  const checkBookingConflict = (
    checkInDate: Date | null,
    checkOutDate: Date | null,
  ) => {
    if (!checkInDate || !checkOutDate) {
      return { hasConflict: false, message: "" };
    }

    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const newCheckInDate = formatLocalDate(checkInDate);
    const newCheckOutDate = formatLocalDate(checkOutDate);

    const activeBookings = existingBookings.filter(
      (booking) =>
        booking.status === "confirmed" || booking.status === "pending",
    );

    const newBookingDates: string[] = [];
    const current = new Date(checkInDate);
    const end = new Date(checkOutDate);

    while (current < end) {
      newBookingDates.push(formatLocalDate(current));
      current.setDate(current.getDate() + 1);
    }

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

    const conflictingBookings: Array<{
      booking: BookingBasic;
      conflictDates: string[];
    }> = [];

    for (const booking of activeBookings) {
      const existingCheckIn = new Date(booking.check_in_date);
      const existingCheckOut = new Date(booking.check_out_date);
      const existingDates: string[] = [];
      const existingCurrent = new Date(existingCheckIn);
      const existingEnd = new Date(existingCheckOut);

      while (existingCurrent < existingEnd) {
        existingDates.push(formatLocalDate(existingCurrent));
        existingCurrent.setDate(existingCurrent.getDate() + 1);
      }

      const overlapping = newBookingDates.filter((date) =>
        existingDates.includes(date),
      );

      if (overlapping.length > 0) {
        conflictingBookings.push({ booking, conflictDates: overlapping });
      }
    }

    if (conflictingBookings.length > 0) {
      const firstConflict = conflictingBookings[0];
      const conflictStart = new Date(firstConflict.conflictDates[0]);
      const conflictEnd = new Date(
        firstConflict.conflictDates[firstConflict.conflictDates.length - 1],
      );
      conflictEnd.setDate(conflictEnd.getDate() + 1);

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

    const checkInCounts = new Map<string, number>();

    activeBookings.forEach((booking) => {
      const existingCheckIn = new Date(booking.check_in_date);
      const existingCheckInDate = formatLocalDate(existingCheckIn);
      const previousCount = checkInCounts.get(existingCheckInDate) || 0;
      checkInCounts.set(existingCheckInDate, previousCount + 1);
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

    return { hasConflict: false, message: "" };
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, type, value } = e.target;
    const readOnlyFields = ["name", "email", "phone"];
    if (readOnlyFields.includes(name)) {
      return;
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

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) {
      showError("Authentication Required", "Please log in to make a booking");
      router.push("/auth");
      setIsSubmitting(false);
      return;
    }

    if (!canCreateBooking) {
      warning(
        "Booking Limit Reached",
        limitMessage ||
          `You have reached the maximum number of pending bookings (${MAX_PENDING_BOOKINGS}). Please wait for confirmation or cancel existing pending bookings.`,
      );
      setIsSubmitting(false);
      return;
    }

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

    if (parseInt(formData.guests) > MAX_GUESTS) {
      showError(
        "Guest Limit Exceeded",
        `Maximum capacity is ${MAX_GUESTS} guests. Please contact us directly for larger events.`,
      );
      setIsSubmitting(false);
      return;
    }

    if (!formData.checkIn || !formData.checkOut) {
      showError(
        "Missing Dates",
        "Please select both check-in and check-out dates",
      );
      setIsSubmitting(false);
      return;
    }

    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      showError("Invalid Dates", "Check-out date must be after check-in date");
      setIsSubmitting(false);
      return;
    }

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

    if (daysDifference < 1) {
      showError(
        "Invalid Stay",
        "Minimum stay is 1 night. Please select at least one night.",
      );
      setIsSubmitting(false);
      return;
    }

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

    const conflictCheck = checkBookingConflict(
      formData.checkIn,
      formData.checkOut,
    );
    if (conflictCheck.hasConflict) {
      showError("Booking Conflict", conflictCheck.message);
      setIsSubmitting(false);
      return;
    }

    const pricing = calculateMultiDayPrice(
      formData.checkIn!,
      formData.checkOut!,
      parseInt(formData.guests),
    );
    const totalAmount = pricing.totalAmount;
    const paymentAmount =
      paymentType === "half" ? Math.round(totalAmount * 0.5) : totalAmount;

    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const checkInDateTime = `${formatLocalDate(formData.checkIn!)}T15:00:00`;
    const checkOutDateTime = `${formatLocalDate(formData.checkOut!)}T13:00:00`;

    const bookingData = {
      user_id: currentUser.id,
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
      total_amount: totalAmount,
      payment_type: paymentType,
      payment_amount: paymentAmount,
    };

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsSubmitting(false);
        showError(
          "Session Expired",
          "Please log in again to create a booking.",
        );
        return;
      }

      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setIsSubmitting(false);
        showError(
          "Booking Failed",
          `Error creating booking: ${
            result.error || "Unknown error"
          }. Please try again.`,
        );
      } else {
        const data = result.booking;

        success("Booking Created!", "Redirecting to payment upload...");

        const uploadUrl = `/upload-payment-proof?bookingId=${data.id}`;

        try {
          router.push(uploadUrl);
        } catch (redirectError) {
          console.error("Primary redirect failed:", redirectError);
          setTimeout(() => {
            try {
              router.replace(uploadUrl);
            } catch (fallbackError) {
              console.error("Fallback redirect failed:", fallbackError);
              window.location.href = uploadUrl;
            }
          }, 500);
        }

        setTimeout(() => {
          setIsSubmitting(false);
        }, 1000);

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
              paymentType,
            };

            const {
              data: { session: emailSession },
            } = await supabase.auth.getSession();
            const emailResponse = await fetch(
              "/api/email/booking-confirmation",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${emailSession?.access_token}`,
                },
                body: JSON.stringify({
                  bookingDetails: emailBookingDetails,
                  phoneNumber: bookingData.guest_phone,
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
          }
        };

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

  return {
    user,
    loading,
    formData,
    setFormData,
    minDate,
    maxBookingDate,
    existingBookings,
    canCreateBooking,
    limitMessage,
    estimatedPrice,
    isSubmitting,
    isPageLoading,
    paymentType,
    setPaymentType,
    pricingBreakdown,
    handleChange,
    handleSubmit,
  };
}
