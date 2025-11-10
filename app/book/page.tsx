"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaCalendarAlt, FaExclamationTriangle, FaHome, FaUser, FaSpinner } from "react-icons/fa";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { canUserCreatePendingBooking } from "../utils/bookingUtils";
import { useToastHelpers } from "../components/Toast";
import { isMaintenanceMode } from "../utils/maintenanceMode";
import { cleanPhoneForDatabase } from "../utils/phoneUtils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Booking {
  id: number;
  check_in_date: string;
  check_out_date: string;
  status: string | null;
}

function BookingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { success, error: showError, warning } = useToastHelpers();

  // All useState hooks must come before any early returns
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: "",
    checkIn: null as Date | null,
    checkOut: null as Date | null,
    pet: false,
    request: "",
  });

  const [minDate, setMinDate] = useState<Date>(new Date());
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [canCreateBooking, setCanCreateBooking] = useState(true);
  const [limitMessage, setLimitMessage] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [paymentType, setPaymentType] = useState<'half' | 'full'>('half'); // Default to half payment
  
  // Track displayed month for calendar overflow fix
  const [displayedMonth, setDisplayedMonth] = useState(new Date().getMonth());
  const [displayedYear, setDisplayedYear] = useState(new Date().getFullYear());

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
        console.error('Error checking maintenance mode:', error);
      }
    };

    checkMaintenanceMode();
    
    // Check every 3 seconds but don't show multiple warnings
    const interval = setInterval(() => {
      checkMaintenanceMode();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [router, warning]);

  // Calculate price based on check-in date (weekday vs weekend/holiday) and guest count
  const calculatePrice = (checkInDate: Date, guestCount: number = 15) => {
    const day = checkInDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // Philippine holidays 2024-2025 (add more as needed)
    const holidays = [
      '2024-12-25', '2024-12-30', '2024-12-31', '2025-01-01', // New Year
      '2025-02-14', // Valentine's Day  
      '2025-04-17', '2025-04-18', '2025-04-19', // Holy Week
      '2025-06-12', // Independence Day
      '2025-08-25', // National Heroes Day
      '2025-11-01', '2025-11-02', // All Saints/Souls Day
      '2025-11-30', // Bonifacio Day
      '2025-12-25', '2025-12-30', '2025-12-31' // Christmas season
    ];
    
    const dateString = checkInDate.toISOString().split('T')[0];
    const isHoliday = holidays.includes(dateString);
    
    // Weekend: Friday (5), Saturday (6), Sunday (0)
    const isWeekend = day === 0 || day === 5 || day === 6;
    
    // Base rate: weekend/holiday or weekday
    const baseRate = (isWeekend || isHoliday) ? 12000 : 9000;
    
    // Add excess guest fee: ₱300 per person above 15
    const excessGuestFee = guestCount > 15 ? (guestCount - 15) * 300 : 0;
    
    return baseRate + excessGuestFee;
  };

  // Data loading useEffect  
  useEffect(() => {
    const today = new Date();
    // Convert to Philippines timezone (UTC+8)
    const philippinesTime = new Date(today.getTime() + (8 * 60 * 60 * 1000));
    setMinDate(philippinesTime);
    
    // Run all data loading operations in parallel for faster loading
    const loadAllData = async () => {
      if (!user) {
        setIsPageLoading(false);
        return;
      }
      
      try {
        // Execute all operations in parallel instead of sequentially
        const [bookingLimitsResult, userData, existingBookingsData] = await Promise.allSettled([
          // Check booking limits
          canUserCreatePendingBooking(user.id),
          
          // Get user data  
          supabase.auth.getUser(),
          
          // Fetch existing bookings - but only get essential data for calendar
          supabase
            .from('bookings')
            .select('id, check_in_date, check_out_date, status')
            .in('status', ['confirmed', 'pending'])
            .limit(100) // Limit to recent bookings for faster query
        ]);

        // Handle booking limits result
        if (bookingLimitsResult.status === 'fulfilled') {
          setCanCreateBooking(bookingLimitsResult.value.canCreate);
          setLimitMessage(bookingLimitsResult.value.message || "");
        } else {
          console.error("Error checking booking limits:", bookingLimitsResult.reason);
          setCanCreateBooking(true); // Fallback to allow booking
        }

        // Handle user data result
        if (userData.status === 'fulfilled' && userData.value.data?.user) {
          const user = userData.value.data.user;
          
          // Get user profile from database to get the correct phone number
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('users')
              .select('name, email, phone')
              .eq('auth_id', user.id)
              .single();
              
            if (!profileError && profileData) {
              // Use database data (more reliable)
              setFormData(prevData => ({
                ...prevData,
                name: profileData.name || prevData.name,
                email: profileData.email || user.email || prevData.email,
                phone: profileData.phone || prevData.phone,
              }));
            } else {
              // Fallback to auth metadata
              const phoneNumber = user.user_metadata?.phone || 
                                 user.user_metadata?.mobile || 
                                 user.user_metadata?.phone_number || 
                                 user.phone || 
                                 "";
              
              const userName = user.user_metadata?.name || "";
              const userEmail = user.email || "";
              
              setFormData(prevData => ({
                ...prevData,
                name: userName || prevData.name,
                email: userEmail || prevData.email,
                phone: phoneNumber || prevData.phone,
              }));
            }
          } catch (err) {
            console.error('Error fetching user profile:', err);
            // Fallback to auth metadata
            const phoneNumber = user.user_metadata?.phone || 
                               user.user_metadata?.mobile || 
                               user.user_metadata?.phone_number || 
                               user.phone || 
                               "";
            
            const userName = user.user_metadata?.name || "";
            const userEmail = user.email || "";
            
            setFormData(prevData => ({
              ...prevData,
              name: userName || prevData.name,
              email: userEmail || prevData.email,
              phone: phoneNumber || prevData.phone,
            }));
          }
        } else {
          console.error('Error loading user data:', userData.status === 'rejected' ? userData.reason : 'No user data');
        }

        // Handle existing bookings result
        if (existingBookingsData.status === 'fulfilled') {
          setExistingBookings(existingBookingsData.value.data || []);
        } else {
          console.error('Error fetching bookings:', existingBookingsData.reason);
          setExistingBookings([]); // Fallback to empty array
        }
        
      } catch (error) {
        console.error('Error loading booking page data:', error);
        // Continue with defaults - don't block the UI
      } finally {
        setIsPageLoading(false); // Always stop loading indicator
      }
    };
    
    loadAllData();
  }, [user]);

  // Update price when check-in date or guest count changes
  useEffect(() => {
    if (formData.checkIn && formData.guests) {
      const guestCount = parseInt(formData.guests) || 15;
      const price = calculatePrice(formData.checkIn, guestCount);
      setEstimatedPrice(price);
    } else if (formData.checkIn) {
      const price = calculatePrice(formData.checkIn, 15);
      setEstimatedPrice(price);
    } else {
      setEstimatedPrice(null);
    }
  }, [formData.checkIn, formData.guests]);

  // Show loading if auth is still loading or page is loading data
  if (loading || isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-300">
            {loading ? 'Loading...' : 'Preparing booking form...'}
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }
  
  // Calculate capacity for visual indicators
  const getDateCapacity = (date: Date) => {
    // Don't show capacity indicators for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return 0; // Past dates should appear normal
    }
    
    const activeBookings = existingBookings.filter(booking => 
      booking.status === 'confirmed' || booking.status === 'pending'
    );
    
    // Normalize date for comparison (remove time component)
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    let isCheckIn = false;
    let isCheckOut = false;
    let isOccupied = false;
    
    activeBookings.forEach(booking => {
      const checkIn = new Date(booking.check_in_date);
      checkIn.setHours(0, 0, 0, 0);
      
      const checkOut = new Date(booking.check_out_date);
      checkOut.setHours(0, 0, 0, 0);
      
      // Check if this date is a check-in date
      if (targetDate.getTime() === checkIn.getTime()) {
        isCheckIn = true;
      }
      
      // Check if this date is a check-out date
      if (targetDate.getTime() === checkOut.getTime()) {
        isCheckOut = true;
      }
      
      // Check if this date is between check-in and check-out (occupied)
      if (targetDate > checkIn && targetDate < checkOut) {
        isOccupied = true;
      }
    });
    
    // Determine the appropriate indicator
    if (isCheckIn && isCheckOut) {
      return 'same-day'; // Same day check-in and check-out (1-day stay)
    } else if (isCheckIn) {
      return 'checkin';
    } else if (isCheckOut) {
      return 'checkout';
    } else if (isOccupied) {
      return 'occupied';
    }
    
    return '';
  };

  // Calculate unavailable dates for the date picker - ONLY block real conflicts
  const getUnavailableDates = () => {
    const toYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    };
    
    // Filter confirmed and pending bookings
    const activeBookings = existingBookings.filter(booking => 
      booking.status === 'confirmed' || booking.status === 'pending'
    );
    
    const unavailableDates: Date[] = [];
    
    // Count check-ins per date (max 2 check-ins allowed per day)
    const checkInCounts = new Map<string, number>();
    
    activeBookings.forEach(booking => {
      const checkIn = new Date(booking.check_in_date);
      const checkInDate = toYMD(checkIn);
      
      const prevCount = checkInCounts.get(checkInDate) || 0;
      checkInCounts.set(checkInDate, prevCount + 1);
    });

    // Only block dates that have reached check-in capacity (2/2)
    for (const [dateStr, count] of checkInCounts) {
      if (count >= 2) {
        unavailableDates.push(new Date(dateStr));
      }
    }

    // Don't block any other dates - let the conflict checker handle it
    // This allows checkout dates to be selectable for new checkins
    
    return unavailableDates;
  };
  
  const checkBookingConflict = (checkInDate: Date | null, checkOutDate: Date | null) => {
    if (!checkInDate || !checkOutDate) return { hasConflict: false, message: '' };

    // Use local date formatting to avoid timezone issues
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const newCheckInDate = formatLocalDate(checkInDate);
    const newCheckOutDate = formatLocalDate(checkOutDate);
    
    // Filter confirmed and pending bookings for conflict checking
    const activeBookings = existingBookings.filter(booking => 
      booking.status === 'confirmed' || booking.status === 'pending'
    );
    
    // 1. Check for exact same date range (prevent double booking)
    for (const booking of activeBookings) {
      const existingCheckIn = new Date(booking.check_in_date);
      const existingCheckOut = new Date(booking.check_out_date);
      const existingCheckInDate = formatLocalDate(existingCheckIn);
      const existingCheckOutDate = formatLocalDate(existingCheckOut);
      
      if (newCheckInDate === existingCheckInDate && newCheckOutDate === existingCheckOutDate) {
        const checkInFormatted = checkInDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const checkOutFormatted = checkOutDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return { 
          hasConflict: true, 
          message: `These exact dates (${checkInFormatted} to ${checkOutFormatted}) are already booked. Please choose different dates.` 
        };
      }
    }
    
    // 2. Check for overlapping stays (guest would be occupying room at same time)
    // Allow same-day turnover: Guest A checkout 12pm, Guest B checkin 2pm same day = OK
    for (const booking of activeBookings) {
      const existingCheckIn = new Date(booking.check_in_date);
      const existingCheckOut = new Date(booking.check_out_date);
      
      const newCheckInTime = checkInDate.getTime();
      const newCheckOutTime = checkOutDate.getTime();
      const existingCheckInTime = existingCheckIn.getTime();
      const existingCheckOutTime = existingCheckOut.getTime();
      
      // TRUE overlap: dates where guests would be there at the same time
      // Same-day turnover is allowed (checkout 12pm, new checkin 2pm same day)
      
      // Allow same-day turnover: if new check-in is on same day as existing check-out, it's allowed
      const newCheckInDateStr = formatLocalDate(checkInDate);
      const existingCheckOutDateStr = formatLocalDate(existingCheckOut);
      
      if (newCheckInDateStr === existingCheckOutDateStr) {
        continue; // Skip this booking, same-day turnover is allowed
      }
      
      const hasOverlap = (
        // New booking starts BEFORE existing booking ends (and not same-day turnover)
        (newCheckInTime >= existingCheckInTime && newCheckInTime < existingCheckOutTime) ||
        // New booking ends AFTER existing booking starts (and not same-day turnover)  
        (newCheckOutTime > existingCheckInTime && newCheckOutTime <= existingCheckOutTime) ||
        // New booking completely encompasses existing booking
        (newCheckInTime < existingCheckInTime && newCheckOutTime > existingCheckOutTime)
      );
      
      if (hasOverlap) {
        const existingCheckInFormatted = existingCheckIn.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const existingCheckOutFormatted = existingCheckOut.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        return { 
          hasConflict: true, 
          message: `Your dates overlap with an existing booking (${existingCheckInFormatted} to ${existingCheckOutFormatted}). Note: Same-day turnover is allowed (check-out 12pm, check-in 2pm).` 
        };
      }
    }

    // 3. Check check-in capacity (max 2 check-ins per day)
    const checkInCounts = new Map<string, number>();
    
    activeBookings.forEach(booking => {
      const existingCheckIn = new Date(booking.check_in_date);
      const existingCheckInDate = formatLocalDate(existingCheckIn);
      
      const prevCount = checkInCounts.get(existingCheckInDate) || 0;
      checkInCounts.set(existingCheckInDate, prevCount + 1);
    });

    const currentCheckIns = checkInCounts.get(newCheckInDate) || 0;
    
    if (currentCheckIns >= 2) {
      const checkInFormatted = checkInDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return { 
        hasConflict: true, 
        message: `${checkInFormatted} already has 2 check-ins scheduled (full capacity). Please choose a different check-in date.` 
      };
    }

    return { hasConflict: false, message: '' }; // No conflicts found
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, type, value } = e.target;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError('Authentication Required', 'Please log in to make a booking');
      router.push('/auth');
      setIsSubmitting(false);
      return;
    }

    // Check if user can create pending bookings (enforce limit)
    if (!canCreateBooking) {
      warning('Booking Limit Reached', limitMessage || 'You have reached the maximum number of pending bookings (3). Please wait for confirmation or cancel existing pending bookings.');
      setIsSubmitting(false);
      return;
    }
    
    // Validate all required fields
    if (!formData.name.trim()) {
      showError('Missing Information', 'Please enter your full name');
      setIsSubmitting(false);
      return;
    }
    
    if (!formData.email.trim()) {
      showError('Missing Information', 'Please enter your email address');
      setIsSubmitting(false);
      return;
    }
    
    if (!formData.guests) {
      showError('Missing Information', 'Please select number of guests');
      setIsSubmitting(false);
      return;
    }
    
    // Validate dates are selected
    if (!formData.checkIn || !formData.checkOut) {
      showError('Missing Dates', 'Please select both check-in and check-out dates');
      setIsSubmitting(false);
      return;
    }
    
    // Validate check-out is after check-in
    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      showError('Invalid Dates', 'Check-out date must be after check-in date');
      setIsSubmitting(false);
      return;
    }
    
    // Check for booking conflicts
    const conflictCheck = checkBookingConflict(formData.checkIn, formData.checkOut);
    if (conflictCheck.hasConflict) {
      showError('Booking Conflict', conflictCheck.message);
      setIsSubmitting(false);
      return;
    }
    
    // Calculate dynamic price based on check-in date and guest count
    const totalAmount = calculatePrice(formData.checkIn!, parseInt(formData.guests));
    const paymentAmount = paymentType === 'half' ? Math.round(totalAmount * 0.5) : totalAmount;
    
    // Fix timezone issue - use local date strings instead of UTC
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const checkInDateTime = `${formatLocalDate(formData.checkIn!)}T14:00:00`; // 2 PM
    const checkOutDateTime = `${formatLocalDate(formData.checkOut!)}T12:00:00`; // 12 PM
    
    const bookingData = {
      user_id: user.id,
      guest_name: formData.name.trim(),
      guest_email: formData.email.trim(),
      guest_phone: formData.phone.trim() ? cleanPhoneForDatabase(formData.phone.trim()) : null,
      number_of_guests: parseInt(formData.guests),
      check_in_date: checkInDateTime,
      check_out_date: checkOutDateTime,
      brings_pet: formData.pet,
      special_requests: formData.request.trim() || null,
      status: 'pending',
      total_amount: totalAmount, // Dynamic pricing based on date
      payment_type: paymentType, // 'half' or 'full'
      payment_amount: paymentAmount // Amount to be paid now
    };
    
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();
        
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setIsSubmitting(false);
        showError('Booking Failed', `Error creating booking: ${error.message || 'Unknown error'}. Please try again.`);
      } else {
        // Booking created successfully - redirect to manual payment upload
        console.log('Booking created successfully:', data);
        
        // Show success message
        success('Booking Created!', 'Redirecting to payment upload...');
        
        // Multiple redirect attempts to ensure reliability
        const uploadUrl = `/upload-payment-proof?bookingId=${data.id}`;
        console.log('Redirecting to upload page with booking ID:', data.id, 'URL:', uploadUrl);
        
        try {
          // Primary redirect method
          router.push(uploadUrl);
        } catch (redirectError) {
          console.error('Primary redirect failed:', redirectError);
          
          // Fallback redirect method
          setTimeout(() => {
            try {
              router.replace(uploadUrl);
            } catch (fallbackError) {
              console.error('Fallback redirect failed:', fallbackError);
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
              checkIn: formData.checkIn!.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              checkOut: formData.checkOut!.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              guests: bookingData.number_of_guests,
              totalAmount: bookingData.total_amount,
              email: bookingData.guest_email,
            };

            const emailResponse = await fetch('/api/email/booking-confirmation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                bookingDetails: emailBookingDetails,
                phoneNumber: bookingData.guest_phone // Add phone for SMS
              }),
            });

            if (!emailResponse.ok) {
              console.warn('Email sending failed, but booking was created successfully');
            }
          } catch (emailError) {
            console.warn('Email service error:', emailError);
            // Email failure doesn't affect user experience since booking is already confirmed
          }
        };

        // Fire and forget - email sending won't block the UI
        sendEmailInBackground();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setIsSubmitting(false);
      showError('Unexpected Error', 'Unexpected error creating booking. Please try again.');
    }
  };

  return (
    <>
      <style jsx global>{`
        .react-datepicker {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%) !important;
          border: 2px solid #374151 !important;
          color: white !important;
          font-family: inherit !important;
          border-radius: 1rem !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2) !important;
          min-height: 480px !important;
          max-height: 480px !important;
          height: 480px !important;
          overflow: hidden !important;
        }
        .react-datepicker__month-container {
          min-height: 420px !important;
          max-height: 420px !important;
          height: 420px !important;
        }
        .react-datepicker__month {
          min-height: 360px !important;
          max-height: 360px !important;
          height: 360px !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .react-datepicker__week {
          display: flex !important;
          justify-content: space-around !important;
          align-items: center !important;
          height: 4rem !important;
          min-height: 4rem !important;
        }
        
        /* Mobile responsiveness for date cells */
        @media (max-width: 768px) {
          .react-datepicker__week {
            height: 3.5rem !important;
            min-height: 3.5rem !important;
          }
          
          .react-datepicker__day {
            width: 2.8rem !important;
            height: 2.8rem !important;
            line-height: 2.8rem !important;
            margin: 0.15rem !important;
            font-size: 0.9rem !important;
          }
          
          .react-datepicker__day-name {
            width: 2.8rem !important;
            height: 2.2rem !important;
            line-height: 2.2rem !important;
            font-size: 0.8rem !important;
          }
        }
        
        /* Extra mobile optimization for very small screens */
        @media (max-width: 480px) {
          .react-datepicker__day {
            width: 2.5rem !important;
            height: 2.5rem !important;
            line-height: 2.5rem !important;
            margin: 0.1rem !important;
            font-size: 0.85rem !important;
          }
          
          .react-datepicker__day-name {
            width: 2.5rem !important;
            height: 2rem !important;
            line-height: 2rem !important;
            font-size: 0.75rem !important;
          }
        }
        .react-datepicker__header {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
          border-bottom: none !important;
          border-radius: 1rem 1rem 0 0 !important;
          padding: 1.25rem 0 !important;
        }
        .react-datepicker__current-month {
          color: white !important;
          font-weight: 700 !important;
          font-size: 1.3rem !important;
          margin-bottom: 1rem !important;
        }
        .react-datepicker__day-name {
          color: rgba(255, 255, 255, 0.9) !important;
          font-weight: 600 !important;
          font-size: 1rem !important;
          width: 3rem !important;
          height: 3rem !important;
          line-height: 3rem !important;
          margin: 0.25rem !important;
          display: inline-block !important;
          text-align: center !important;
        }
        .react-datepicker__day {
          color: white !important;
          border-radius: 0.5rem !important;
          margin: 0.25rem !important;
          border: none !important;
          width: 3rem !important;
          height: 3rem !important;
          line-height: 3rem !important;
          font-size: 1rem !important;
          transition: all 0.2s ease !important;
          display: inline-block !important;
          text-align: center !important;
          background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
          position: relative !important;
        }
        .react-datepicker__day:hover {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          transform: scale(1.05) !important;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3) !important;
        }
        .react-datepicker__day::after {
          content: 'OPEN' !important;
          position: absolute !important;
          bottom: 1px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          font-size: 8px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 1px 2px !important;
          border-radius: 2px !important;
          line-height: 1 !important;
          font-weight: bold !important;
          white-space: nowrap !important;
        }
        
        /* 📱 MOBILE: Keep OPEN readable */
        @media (max-width: 768px) {
          .react-datepicker__day::after {
            content: 'OPEN' !important;
            font-size: 8px !important;
            padding: 1px 2px !important;
            bottom: 2px !important;
          }
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--range-start,
        .react-datepicker__day--range-end {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
          color: white !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.5) !important;
        }
        .react-datepicker__day--in-range {
          background: rgba(249, 115, 22, 0.3) !important;
          color: white !important;
        }
        .react-datepicker__day--excluded {
          color: #6b7280 !important;
          text-decoration: none !important;
          background: #374151 !important;
          opacity: 0.6 !important;
        }
        .react-datepicker__day--excluded:hover {
          background: #374151 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }
        .react-datepicker__day--excluded::after {
          content: 'N/A' !important;
          position: absolute !important;
          bottom: 1px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          font-size: 10px !important;
          background: rgba(0,0,0,0.8) !important;
          color: #9ca3af !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          line-height: 1 !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          max-width: 90% !important;
          overflow: hidden !important;
        }
        
        /* Override today styling to look normal */
        .react-datepicker__day--today {
          background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
          color: white !important;
          font-weight: normal !important;
          border: none !important;
        }
        .react-datepicker__day--today:hover {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          transform: scale(1.05) !important;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3) !important;
        }
        .react-datepicker__day--disabled {
          color: #6b7280 !important;
          background: #374151 !important;
          opacity: 0.5 !important;
        }
        .react-datepicker__day--disabled:hover {
          background: #374151 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }
        .react-datepicker__day--disabled::after {
          content: 'N/A' !important;
          position: absolute !important;
          bottom: 1px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          font-size: 10px !important;
          background: rgba(0,0,0,0.8) !important;
          color: #9ca3af !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          line-height: 1 !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          max-width: 90% !important;
          overflow: hidden !important;
        }
        
        /* Selected dates override all other states */
        .react-datepicker__day--selected {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
          border: 2px solid #ea580c !important;
        }
        .react-datepicker__day--selected:hover {
          background: linear-gradient(135deg, #fb923c 0%, #f97316 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--selected::after {
          content: 'PICK' !important;
          position: absolute !important;
          bottom: 1px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          font-size: 10px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          line-height: 1 !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          max-width: 90% !important;
          overflow: hidden !important;
        }
        
        /* 📱 MOBILE: Shorter labels for better readability */
        @media (max-width: 768px) {
          .react-datepicker__day--selected::after {
            content: 'PICK' !important;
            font-size: 8px !important;
            padding: 1px 2px !important;
            bottom: 2px !important;
          }
        }
        
        .react-datepicker__day--same-day {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .react-datepicker__day--same-day:hover {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--same-day::after {
          content: 'FULL' !important;
          position: absolute !important;
          bottom: 1px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          font-size: 10px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          line-height: 1 !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          max-width: 90% !important;
          overflow: hidden !important;
        }
        
        /* 📱 MOBILE: Shorter labels for better readability */
        @media (max-width: 768px) {
          .react-datepicker__day--same-day::after {
            content: 'FULL' !important;
            font-size: 8px !important;
            padding: 1px 2px !important;
            bottom: 2px !important;
          }
        }
        
        /* Custom capacity indicator classes */
        .react-datepicker__day--checkin {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .react-datepicker__day--checkin:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--checkin::after {
          content: 'IN' !important;
          position: absolute !important;
          bottom: 1px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          font-size: 10px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          line-height: 1 !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          max-width: 90% !important;
          overflow: hidden !important;
        }
        
        /* 📱 MOBILE: Shorter labels for better readability */
        @media (max-width: 768px) {
          .react-datepicker__day--checkin::after {
            content: 'IN' !important;
            font-size: 10px !important;
            padding: 2px 3px !important;
            bottom: 2px !important;
          }
        }
        
        .react-datepicker__day--checkout {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .react-datepicker__day--checkout:hover {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--checkout::after {
          content: 'OUT' !important;
          position: absolute !important;
          bottom: 1px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          font-size: 10px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          line-height: 1 !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          max-width: 90% !important;
          overflow: hidden !important;
        }
        
        /* 📱 MOBILE: Shorter labels for better readability */
        @media (max-width: 768px) {
          .react-datepicker__day--checkout::after {
            content: 'OUT' !important;
            font-size: 10px !important;
            padding: 2px 3px !important;
            bottom: 2px !important;
          }
        }
        
        .react-datepicker__day--occupied {
          background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .react-datepicker__day--occupied:hover {
          background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--occupied::after {
          content: 'BUSY' !important;
          position: absolute !important;
          bottom: 1px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          font-size: 10px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          line-height: 1 !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          max-width: 90% !important;
          overflow: hidden !important;
        }
        
        /* 📱 MOBILE: Shorter labels for better readability */
        @media (max-width: 768px) {
          .react-datepicker__day--occupied::after {
            content: 'BUSY' !important;
            font-size: 8px !important;
            padding: 1px 2px !important;
            bottom: 2px !important;
          }
        }
        
        .react-datepicker__day--partial {
          background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .react-datepicker__day--partial:hover {
          background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--partial::after {
          content: 'BOOKED' !important;
          position: absolute !important;
          bottom: 2px !important;
          right: 2px !important;
          font-size: 7px !important;
          background: rgba(0,0,0,0.7) !important;
          color: white !important;
          padding: 1px 2px !important;
          border-radius: 2px !important;
          line-height: 1 !important;
        }
        
        .react-datepicker__day--booked {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .react-datepicker__day--booked:hover {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          cursor: not-allowed !important;
          transform: none !important;
        }
        .react-datepicker__day--booked::after {
          content: 'ERROR' !important;
          position: absolute !important;
          bottom: 2px !important;
          right: 2px !important;
          font-size: 7px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 1px 2px !important;
          border-radius: 2px !important;
          line-height: 1 !important;
        }
        .react-datepicker__navigation {
          top: 1.2rem !important;
        }
        .react-datepicker__navigation--previous {
          border-right-color: white !important;
          left: 1rem !important;
        }
        .react-datepicker__navigation--next {
          border-left-color: white !important;
          right: 1rem !important;
        }
        .react-datepicker__input-container input {
          background-color: #1f2937 !important;
          border: 1px solid #374151 !important;
          color: white !important;
          width: 100% !important;
          padding: 0.5rem 1rem !important;
          border-radius: 0.375rem !important;
          height: auto !important;
          min-height: 42px !important;
          font-size: 1rem !important;
          line-height: 1.5 !important;
        }
        .react-datepicker__input-container input:focus {
          outline: none !important;
          border-color: #374151 !important;
        }
        .react-datepicker__input-container input::placeholder {
          color: #9ca3af !important;
        }

        /* Fix browser autofill styling - consistent dark theme */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #1f2937 inset !important;
          -webkit-text-fill-color: white !important;
          background-color: #1f2937 !important;
          border: 1px solid #374151 !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }

        /* Force DatePicker input to be transparent */
        .react-datepicker__input-container input {
          background-color: transparent !important;
          background: transparent !important;
        }

        /* Inline calendar specific styles */
        .inline-calendar {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          width: 100% !important;
        }
        .inline-calendar .react-datepicker__month-container {
          background: transparent !important;
          width: 100% !important;
        }
        .react-datepicker--inline {
          background: transparent !important;
          border: none !important;
          width: 100% !important;
        }
        .react-datepicker--inline .react-datepicker__month {
          margin: 0 !important;
        }
        .react-datepicker__week {
          display: flex !important;
          justify-content: space-around !important;
        }
        .react-datepicker__day-names {
          display: flex !important;
          justify-content: space-around !important;
        }
        
        /* 🛡️ ENHANCED: Hide and disable outside month dates with maximum protection */
        .react-datepicker__day--outside-month {
          visibility: hidden !important;
          pointer-events: none !important;
          opacity: 0 !important;
          user-select: none !important;
          cursor: default !important;
          position: relative !important;
        }
        
        /* Ensure outside month dates can't be hovered or interacted with */
        .react-datepicker__day--outside-month:hover,
        .react-datepicker__day--outside-month:focus,
        .react-datepicker__day--outside-month:active {
          background-color: transparent !important;
          transform: none !important;
          box-shadow: none !important;
          cursor: default !important;
          pointer-events: none !important;
        }
        
        /* 🚀 PERFORMANCE: Block any potential click events on outside dates */
        .react-datepicker__day--outside-month::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 10 !important;
          pointer-events: none !important;
        }
        
        /* Force consistent 6-row calendar layout */
        .react-datepicker__month {
          min-height: 390px !important;
          max-height: 390px !important;
          height: 390px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
        
        /* Ensure 6 weeks are always shown */
        .react-datepicker__week {
          display: flex !important;
          justify-content: space-around !important;
          align-items: center !important;
          height: 60px !important;
          min-height: 60px !important;
          flex: 1 !important;
        }
        
        /* Force calendar container to maintain consistent height */
        .react-datepicker {
          min-height: 480px !important;
          max-height: 480px !important;
          height: 480px !important;
        }
        
        /* Ensure month container maintains height */
        .react-datepicker__month-container {
          min-height: 420px !important;
          max-height: 420px !important;
          height: 420px !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Ensure day names row has consistent height */
        .react-datepicker__day-names {
          display: flex !important;
          justify-content: space-around !important;
          height: 40px !important;
          min-height: 40px !important;
          align-items: center !important;
        }
        
        /* Force consistent spacing between all calendar elements */
        .react-datepicker__header {
          padding: 1rem 0 !important;
          height: 60px !important;
          min-height: 60px !important;
        }
        
        /* 🚀 FINAL MOBILE OVERRIDES - Must come last to override desktop styles */
        @media (max-width: 768px) {
          .react-datepicker__day {
            width: 2.8rem !important;
            height: 2.8rem !important;
            line-height: 2.8rem !important;
            margin: 0.15rem !important;
            font-size: 0.9rem !important;
          }
          
          .react-datepicker__day-name {
            width: 2.8rem !important;
            height: 2.2rem !important;
            line-height: 2.2rem !important;
            font-size: 0.8rem !important;
          }
          
          .react-datepicker__week {
            height: 3.5rem !important;
            min-height: 3.5rem !important;
          }
        }
        
        /* Extra small mobile screens */
        @media (max-width: 480px) {
          .react-datepicker__day {
            width: 2.5rem !important;
            height: 2.5rem !important;
            line-height: 2.5rem !important;
            margin: 0.1rem !important;
            font-size: 0.85rem !important;
          }
          
          .react-datepicker__day-name {
            width: 2.5rem !important;
            height: 2rem !important;
            line-height: 2rem !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
      
      {/* Navigation Bar */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-20">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaHome className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </Link>
              <div className="text-white">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 relative">
                    <Image
                      src="/logo.png"
                      alt="Kampo Ibayo Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold">Kampo Ibayo</h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Booking Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/profile" 
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </Link>
              <div className="text-xs sm:text-sm text-gray-400 text-right">
                <span className="inline-block bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  ● Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main
      className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center p-4 sm:p-6 pt-24"
      style={{
        backgroundImage: "url('/pool.jpg')",
      }}
    >
      <div className="bg-gray-900/95 backdrop-blur-sm text-white rounded-2xl shadow-2xl w-full max-w-6xl p-4 sm:p-6 lg:p-8 border border-gray-700/50">
        {/* Modern header with gradient accent */}
        <div className="text-center mb-6">
          <div className="inline-block mb-3">
            <div className="w-16 h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-full mx-auto"></div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-2">
            Book Your Escape
          </h1>
          <p className="text-gray-400 text-base">Experience luxury and comfort at Kampo Ibayo</p>
        </div>

        {/* Booking Limit Warning */}
        {!canCreateBooking && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="w-4 h-4 text-red-500" />
              <p className="text-red-400 text-sm font-medium">
                {limitMessage}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Personal Info & Preferences */}
          <div className="space-y-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <FaUser className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Guest Details</h2>
            </div>
            
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Full Name <span className="text-red-500">*</span>
              </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full rounded-xl border-2 px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 ${
                formData.name 
                  ? 'bg-green-900/20 border-green-600 focus:border-green-500 focus:ring-green-500/30 text-white' 
                  : 'bg-gray-800/50 border-gray-600 focus:border-red-500 focus:ring-red-500/30 text-white'
              } placeholder-gray-500`}
              required
               placeholder="Enter your full name"
            />
            </div>

            {/* Email + Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Email Address <span className="text-red-500">*</span>
                </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full rounded-xl border-2 px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 ${
                  formData.email 
                    ? 'bg-green-900/20 border-green-600 focus:border-green-500 focus:ring-green-500/30 text-white' 
                    : 'bg-gray-800/50 border-gray-600 focus:border-red-500 focus:ring-red-500/30 text-white'
                } placeholder-gray-500`}
                required
                placeholder="you@example.com"
              />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Mobile Number
                </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full rounded-xl border-2 px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 ${
                  formData.phone 
                    ? 'bg-green-900/20 border-green-600 focus:border-green-500 focus:ring-green-500/30 text-white' 
                    : 'bg-gray-800/50 border-gray-600 focus:border-red-500 focus:ring-red-500/30 text-white'
                } placeholder-gray-500`}
                placeholder="+63 912 345 6789"              
              />
              </div>
            </div>

            {/* Guests */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Number of Guests <span className="text-red-500">*</span>
              </label>
              <div className="mb-3 p-3 bg-blue-900/20 border border-blue-600/40 rounded-lg">
                <p className="text-xs text-blue-200">
                  ℹ️ <span className="font-semibold">Standard:</span> 15 guests · ₱300/person for extras
                </p>
              </div>
              
              {/* Quick Select Cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, guests: "8" })}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.guests === "8"
                      ? 'bg-red-600 border-red-500 shadow-lg shadow-red-500/30'
                      : 'bg-gray-800/50 border-gray-600 hover:border-red-500 hover:bg-gray-800'
                  }`}
                >
                  <div className="text-3xl font-bold text-white">8</div>
                  <div className="text-xs text-gray-300 mt-1">guests</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, guests: "15" })}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.guests === "15"
                      ? 'bg-red-600 border-red-500 shadow-lg shadow-red-500/30'
                      : 'bg-gray-800/50 border-gray-600 hover:border-red-500 hover:bg-gray-800'
                  }`}
                >
                  <div className="text-3xl font-bold text-white">15</div>
                  <div className="text-xs text-green-400 mt-1">Standard</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, guests: "25" })}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.guests === "25"
                      ? 'bg-red-600 border-red-500 shadow-lg shadow-red-500/30'
                      : 'bg-gray-800/50 border-gray-600 hover:border-red-500 hover:bg-gray-800'
                  }`}
                >
                  <div className="text-3xl font-bold text-white">25</div>
                  <div className="text-xs text-yellow-400 mt-1">Maximum</div>
                </button>
              </div>

              {/* Custom Counter */}
              <div className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all duration-200 ${
                formData.guests 
                  ? 'bg-green-900/20 border-green-600' 
                  : 'bg-gray-800/50 border-gray-600'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(formData.guests) || 1;
                    if (current > 1) {
                      setFormData({ ...formData, guests: String(current - 1) });
                    }
                  }}
                  className="w-10 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!formData.guests || parseInt(formData.guests) <= 1}
                >
                  −
                </button>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {formData.guests || 0}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formData.guests ? `guest${parseInt(formData.guests) > 1 ? 's' : ''}` : 'Select guests'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(formData.guests) || 0;
                    if (current < 25) {
                      setFormData({ ...formData, guests: String(current + 1) });
                    }
                  }}
                  className="w-10 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!!(formData.guests && parseInt(formData.guests) >= 25)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Pet info */}
            <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              formData.pet 
                ? 'bg-green-900/20 border-green-600' 
                : 'bg-gray-800/30 border-gray-600 hover:border-gray-500'
            }`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="pet"
                  checked={formData.pet}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 text-red-600 focus:ring-2 focus:ring-red-500 border-gray-600 rounded cursor-pointer"
                />
                <span className="flex-1">
                  <span className="block font-semibold text-white">I will be bringing a pet 🐾</span>
                  <span className="text-sm text-gray-400 mt-1 block">
                    Pets are welcome at no additional cost. Please notify us in advance.
                  </span>
                </span>
              </label>
            </div>

            {/* Special Request */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Special Requests
              </label>
              <textarea
                name="request"
                value={formData.request}
                onChange={handleChange}
                rows={9.9}
                placeholder="Tell us about any special accommodations or requests..."
                className={`w-full rounded-xl border-2 px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 resize-none ${
                  formData.request 
                    ? 'bg-green-900/20 border-green-600 focus:border-green-500 focus:ring-green-500/30 text-white' 
                    : 'bg-gray-800/50 border-gray-600 focus:border-red-500 focus:ring-red-500/30 text-white'
                } placeholder-gray-500`}
              />
            </div>

            {/* Payment Type Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300">
                Payment Option <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Half Payment Option */}
                <button
                  type="button"
                  onClick={() => setPaymentType('half')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    paymentType === 'half'
                      ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/30'
                      : 'bg-gray-800/50 border-gray-600 hover:border-blue-500 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentType === 'half' ? 'border-white bg-white' : 'border-gray-400'
                    }`}>
                      {paymentType === 'half' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                    </div>
                    <span className="font-bold text-white">50% Down Payment</span>
                  </div>
                  <div className="text-sm text-gray-300 ml-7">
                    Pay half now, settle the balance on check-in
                  </div>
                  {estimatedPrice && (
                    <div className="text-lg font-bold text-blue-400 ml-7 mt-1">
                      ₱{Math.round(estimatedPrice * 0.5).toLocaleString()}
                    </div>
                  )}
                </button>

                {/* Full Payment Option */}
                <button
                  type="button"
                  onClick={() => setPaymentType('full')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    paymentType === 'full'
                      ? 'bg-green-600 border-green-500 shadow-lg shadow-green-500/30'
                      : 'bg-gray-800/50 border-gray-600 hover:border-green-500 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentType === 'full' ? 'border-white bg-white' : 'border-gray-400'
                    }`}>
                      {paymentType === 'full' && <div className="w-2 h-2 bg-green-600 rounded-full"></div>}
                    </div>
                    <span className="font-bold text-white">Full Payment</span>
                  </div>
                  <div className="text-sm text-gray-300 ml-7">
                    Pay the complete amount upfront
                  </div>
                  {estimatedPrice && (
                    <div className="text-lg font-bold text-green-400 ml-7 mt-1">
                      ₱{estimatedPrice.toLocaleString()}
                    </div>
                  )}
                </button>
              </div>
              
              {/* Payment Benefits */}
              <div className="mt-3 p-3 bg-gray-800/30 border border-gray-600 rounded-lg">
                <p className="text-xs text-gray-400">
                  💡 <span className="font-semibold">Tip:</span> {paymentType === 'half' 
                    ? 'Down payment secures your booking. Pay remaining balance on arrival.' 
                    : 'Full payment provides peace of mind - no additional payments needed!'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Dates & Calendar */}
          <div className="space-y-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <FaCalendarAlt className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Select Your Dates</h2>
            </div>

            {/* Inline Calendar - Larger */}
            <div>
              <div className="bg-gray-800/50 rounded-xl border-2 border-gray-700 p-4 flex justify-center min-h-[520px]">
                <DatePicker
                  selected={formData.checkIn}
                  onChange={(dates) => {
                    if (Array.isArray(dates)) {
                      const [start, end] = dates;
                      
                      // 🛡️ SAFETY: Double protection against outside month date selection
                      // Validate start date is within displayed month
                      if (start && (start.getMonth() !== displayedMonth || start.getFullYear() !== displayedYear)) {
                        console.warn('Prevented outside month date selection:', start);
                        return; // Early return - don't update state
                      }
                      
                      // Validate end date is within displayed month (if exists)
                      if (end && (end.getMonth() !== displayedMonth || end.getFullYear() !== displayedYear)) {
                        console.warn('Prevented outside month date selection:', end);
                        return; // Early return - don't update state
                      }
                      
                      // ✅ Safe to update - dates are within current month
                      setFormData({ ...formData, checkIn: start, checkOut: end });
                    }
                  }}
                  startDate={formData.checkIn}
                  endDate={formData.checkOut}
                  selectsRange
                  minDate={minDate}
                  maxDate={maxBookingDate}
                  excludeDates={getUnavailableDates()}
                  // Track month changes to prevent overflow date selection
                  onMonthChange={(date) => {
                    setDisplayedMonth(date.getMonth());
                    setDisplayedYear(date.getFullYear());
                  }}
                  // Force 6 weeks to be shown for consistent layout
                  fixedHeight
                  showWeekNumbers={false}
                  dayClassName={(date) => {
                    // 🛡️ PRIORITY 1: Hide dates from outside the displayed month (HIGHEST PRIORITY)
                    if (date.getMonth() !== displayedMonth || date.getFullYear() !== displayedYear) {
                      return 'react-datepicker__day--outside-month';
                    }
                    
                    // 🔍 SAFETY CHECK: Validate date is actually within current month view
                    const currentMonthStart = new Date(displayedYear, displayedMonth, 1);
                    const currentMonthEnd = new Date(displayedYear, displayedMonth + 1, 0);
                    
                    if (date < currentMonthStart || date > currentMonthEnd) {
                      console.warn('Date outside month range detected:', date);
                      return 'react-datepicker__day--outside-month';
                    }
                    
                    // ✅ SAFE ZONE: Date is confirmed within current month
                    
                    // Check if this date is selected (check-in or check-out)
                    const isSelected = (formData.checkIn && date.toDateString() === formData.checkIn.toDateString()) ||
                                     (formData.checkOut && date.toDateString() === formData.checkOut.toDateString());
                    
                    // Selected dates override booking status
                    if (isSelected) {
                      return 'react-datepicker__day--selected';
                    }
                    
                    // Otherwise show booking status
                    const capacity = getDateCapacity(date);
                    if (capacity === 'same-day') return 'react-datepicker__day--same-day';
                    if (capacity === 'checkin') return 'react-datepicker__day--checkin';
                    if (capacity === 'checkout') return 'react-datepicker__day--checkout';
                    if (capacity === 'occupied') return 'react-datepicker__day--occupied';
                    return '';
                  }}
                  inline
                  monthsShown={1}
                  calendarClassName="inline-calendar"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-green-600"></span>
                  <span className="text-gray-300">
                    <span className="hidden sm:inline">Open</span>
                    <span className="sm:hidden">Open</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-orange-600"></span>
                  <span className="text-gray-300">
                    <span className="hidden sm:inline">Selected</span>
                    <span className="sm:hidden">Pick ✓</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-blue-600"></span>
                  <span className="text-gray-300">
                    <span className="hidden sm:inline">Check-in</span>
                    <span className="sm:hidden">In</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-red-600"></span>
                  <span className="text-gray-300">
                    <span className="hidden sm:inline">Check-out</span>
                    <span className="sm:hidden">Out</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-yellow-600"></span>
                  <span className="text-gray-300">
                    <span className="hidden sm:inline">Occupied</span>
                    <span className="sm:hidden">Busy</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-purple-600"></span>
                  <span className="text-gray-300">
                    <span className="hidden sm:inline">Full Day</span>
                    <span className="sm:hidden">Full</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-gray-600"></span>
                  <span className="text-gray-300">
                    <span className="hidden sm:inline">Unavailable</span>
                    <span className="sm:hidden">N/A</span>
                  </span>
                </span>
              </div>
            </div>

            {/* Pricing Info - Always Show with Dates */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border-2 border-gray-700 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">₱</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Booking Summary</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  paymentType === 'half' 
                    ? 'bg-blue-900/40 text-blue-300 border border-blue-600/30' 
                    : 'bg-green-900/40 text-green-300 border border-green-600/30'
                }`}>
                  {paymentType === 'half' ? '50% Payment' : 'Full Payment'}
                </div>
              </div>
              <div className="space-y-2">
                {/* Check-in and Check-out Dates */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="p-2.5 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Check-in</p>
                    <p className="text-white font-semibold text-sm">
                      {formData.checkIn ? formData.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select date'}
                    </p>
                    <p className="text-xs text-green-400 mt-0.5">● 2:00 PM</p>
                  </div>
                  <div className="p-2.5 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Check-out</p>
                    <p className="text-white font-semibold text-sm">
                      {formData.checkOut ? formData.checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select date'}
                    </p>
                    <p className="text-xs text-orange-400 mt-0.5">● 12:00 PM</p>
                  </div>
                </div>

                {estimatedPrice && formData.checkIn ? (
                  <>
                    <div className="flex justify-between items-center p-2.5 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-300 text-sm font-medium">Rate Type:</span>
                      <span className="text-white font-semibold text-sm">
                        {calculatePrice(formData.checkIn, 15) === 12000 ? '🌴 Weekend/Holiday' : '📅 Weekday'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-300 text-sm font-medium">Base Rate:</span>
                      <span className="text-white font-semibold">
                        ₱{calculatePrice(formData.checkIn, 15).toLocaleString()}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-2.5 rounded-lg border ${
                      formData.guests && parseInt(formData.guests) > 15
                        ? 'bg-yellow-900/20 border-yellow-600/30'
                        : 'bg-gray-800/50 border-gray-700'
                    }`}>
                      <span className={`text-sm font-medium ${
                        formData.guests && parseInt(formData.guests) > 15
                          ? 'text-yellow-200'
                          : 'text-gray-300'
                      }`}>
                        Extra Guests {formData.guests && parseInt(formData.guests) > 15 ? `(+${parseInt(formData.guests) - 15})` : '(+0)'}:
                      </span>
                      <span className={`font-semibold ${
                        formData.guests && parseInt(formData.guests) > 15
                          ? 'text-yellow-400'
                          : 'text-white'
                      }`}>
                        {formData.guests && parseInt(formData.guests) > 15 
                          ? `+₱${((parseInt(formData.guests) - 15) * 300).toLocaleString()}`
                          : '₱0'
                        }
                      </span>
                    </div>
                    <div className="pt-3 mt-2 border-t-2 border-gray-700 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-white">Total Amount:</span>
                        <span className="text-xl font-bold text-gray-300">
                          ₱{estimatedPrice.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Payment breakdown based on selected payment type */}
                      {paymentType === 'half' ? (
                        <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-blue-300">Down Payment (Pay Now):</span>
                            <span className="text-lg font-bold text-blue-300">
                              ₱{Math.round(estimatedPrice * 0.5).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-200">Balance (Pay on Arrival):</span>
                            <span className="text-sm text-blue-200">
                              ₱{(estimatedPrice - Math.round(estimatedPrice * 0.5)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-green-300">Full Payment (Pay Now):</span>
                            <span className="text-lg font-bold text-green-300">
                              ₱{estimatedPrice.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-200">✓ No additional payment required</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 border-t border-gray-700">
                    <p className="text-gray-400 text-sm">Complete dates to see pricing</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Width Submit Button */}
          <div className="lg:col-span-2 mt-6">
            <button
              type="submit"
              disabled={!canCreateBooking || isSubmitting}
              className={`w-full font-bold py-4 rounded-2xl transition-all duration-200 text-lg shadow-lg relative overflow-hidden ${
                canCreateBooking && !isSubmitting
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white hover:from-red-700 hover:via-red-800 hover:to-red-900 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-3">
                  <FaSpinner className="animate-spin w-5 h-5" />
                  <span>Processing Reservation...</span>
                </div>
              ) : canCreateBooking ? (
                estimatedPrice 
                  ? paymentType === 'half' 
                    ? `Pay Down Payment - ₱${Math.round(estimatedPrice * 0.5).toLocaleString()}`
                    : `Pay Full Amount - ₱${estimatedPrice.toLocaleString()}`
                  : ' Complete Booking Details'
              ) : (
                '⚠️ Booking Limit Reached'
              )}
            </button>
            {estimatedPrice && canCreateBooking && !isSubmitting && (
              <p className="text-center text-sm text-gray-400 mt-3">
                By reserving, you agree to our booking terms and conditions
              </p>
            )}
            {isSubmitting && (
              <p className="text-center text-sm text-blue-400 mt-3 animate-pulse">
                ⏳ Securing your reservation... Please don&apos;t close this page
              </p>
            )}
          </div>
        </form>
      </div>
    </main>
    </>
  );
}

// Export the component directly - auth is handled inside
export default BookingPage;
