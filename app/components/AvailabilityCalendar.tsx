"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CircleCheck, LogIn, LogOut, Users, Ban, Lock, Info, Moon, CalendarDays, MousePointerClick } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AvailabilityCalendarProps {
  selectedCheckIn: string; // Current booking check-in date (to block)
  selectedCheckOut: string; // Current booking check-out date (to block)
  onDateSelect: (checkIn: string, checkOut: string) => void;
  excludeBookingId?: number; // Exclude current booking from availability check
  minDate?: string; // Minimum selectable date
  isRescheduling?: boolean; // Allow more flexible date selection during reschedule
}

interface BookedDate {
  check_in_date: string;
  check_out_date: string;
  status: string | null;
}

export default function AvailabilityCalendar({
  selectedCheckIn,
  selectedCheckOut,
  onDateSelect,
  excludeBookingId,
  minDate,
  isRescheduling = false
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState<'check-in' | 'check-out'>('check-in');
  const [newCheckIn, setNewCheckIn] = useState(""); // NEW dates being selected for reschedule
  const [newCheckOut, setNewCheckOut] = useState("");
  
  // Timezone-agnostic date formatter - no Date objects involved
  const formatDateSafe = (dateString: string): string => {
    if (!dateString) return 'Select date';
    const [year, month, day] = dateString.split('-');
    // Simple string formatting - no timezone conversion
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
  };
  
  // Debug logging only when needed
  if (process.env.NODE_ENV === 'development' && excludeBookingId) {
    console.log('📅 [AvailabilityCalendar] Reschedule mode:', {
      selectedCheckIn,
      selectedCheckOut,
      excludeBookingId,
      newCheckIn,
      newCheckOut
    });
  }

  // Load booked dates from database (SAME LOGIC AS HOMEPAGE)
  useEffect(() => {
    const loadBookedDates = async () => {
      try {
        setLoading(true);

        // Use the EXACT same logic as homepage and booking page
        // Extend range to include previous and next month dates that appear in calendar
        const now = new Date();
        const startOfRange = new Date(now.getFullYear(), now.getMonth() - 1, 15); // Start from mid previous month
        const endOfRange = new Date(now.getFullYear(), now.getMonth() + 2, 15); // End in mid next month

        // Helper to format local date as YYYY-MM-DD (avoid timezone shifts)
        const toYMD = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${da}`;
        };

        let query = supabase
          .from('bookings')
          .select('check_in_date, check_out_date, status')
          .in('status', ['confirmed', 'pending']) // Show BOTH confirmed AND pending bookings (same as homepage)
          .or(`and(check_in_date.gte.${toYMD(startOfRange)},check_in_date.lte.${toYMD(endOfRange)}),and(check_out_date.gte.${toYMD(startOfRange)},check_out_date.lte.${toYMD(endOfRange)}),and(check_in_date.lte.${toYMD(startOfRange)},check_out_date.gte.${toYMD(endOfRange)})`)
          .limit(50);

        // Exclude the current booking if provided
        if (excludeBookingId) {
          query = query.neq('id', excludeBookingId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching bookings:', error);
          setBookedDates([]);
          return;
        }

        console.log('📅 AvailabilityCalendar fetched bookings:', data);
        console.log('📅 Excluded booking ID:', excludeBookingId);
        
        // Debug: Log each booking's dates in a readable format
        if (data && data.length > 0) {
          data.forEach((booking, index) => {
            console.log(`Booking ${index + 1}:`, {
              checkIn: booking.check_in_date,
              checkOut: booking.check_out_date,
              status: booking.status,
              checkInFormatted: new Date(booking.check_in_date).toLocaleDateString(),
              checkOutFormatted: new Date(booking.check_out_date).toLocaleDateString()
            });
          });
        }
        
        setBookedDates(data || []);
      } catch (error) {
        console.error('Error loading booked dates:', error);
        setBookedDates([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookedDates();
  }, [excludeBookingId]);

  // Check if a date is booked (returns the booking status type) - EXACT SAME LOGIC AS HOMEPAGE
  const getDateBookingStatus = (date: Date): 'available' | 'checkin' | 'checkout' | 'busy' | 'full' => {
    // Don't show capacity indicators for past dates (before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < today) {
      return 'available'; // Past dates appear as available in visual but are not selectable
    }
    
    const activeBookings = bookedDates.filter(booking => 
      booking.status === 'confirmed' || booking.status === 'pending'
    );
    
    // Normalize date for comparison (remove time component)
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    let isCheckIn = false;
    let isCheckOut = false;
    let isOccupied = false;
    
    // Optional debug logging for development
    const targetDateStr = targetDate.toLocaleDateString();
    const isDebugDate = process.env.NODE_ENV === 'development' && (targetDateStr.includes('11/27') || targetDateStr.includes('11/28') || targetDateStr.includes('11/29') || targetDateStr.includes('11/30'));
    
    activeBookings.forEach((booking, bookingIndex) => {
      const checkIn = new Date(booking.check_in_date);
      checkIn.setHours(0, 0, 0, 0);
      
      const checkOut = new Date(booking.check_out_date);
      checkOut.setHours(0, 0, 0, 0);
      
      // Simplified debug logging
      if (isDebugDate) {
        console.log(`    Booking ${bookingIndex + 1}: ${checkIn.toLocaleDateString()} to ${checkOut.toLocaleDateString()}`);
      }
      
      // Check if this date is a check-in date
      if (targetDate.getTime() === checkIn.getTime()) {
        isCheckIn = true;
        if (isDebugDate) console.log(`    ✅ ${targetDateStr} is CHECK-IN`);
      }
      
      // Check if this date is a check-out date
      if (targetDate.getTime() === checkOut.getTime()) {
        isCheckOut = true;
        if (isDebugDate) console.log(`    ✅ ${targetDateStr} is CHECK-OUT`);
      }
      
      // Check if this date is between check-in and check-out (occupied)
      if (targetDate > checkIn && targetDate < checkOut) {
        isOccupied = true;
        if (isDebugDate) console.log(`    ✅ ${targetDateStr} is OCCUPIED (between ${checkIn.toLocaleDateString()} and ${checkOut.toLocaleDateString()})`);
      }
    });
    
    // Determine the appropriate indicator (same logic as homepage)
    if (isCheckIn && isCheckOut) {
      return 'full'; // Same day check-in and check-out (1-day stay)
    } else if (isCheckIn) {
      return 'checkin';
    } else if (isCheckOut) {
      return 'checkout';
    } else if (isOccupied) {
      return 'busy';
    }
    
    return 'available';
  };

  // Legacy function for backward compatibility
  const isDateBooked = (date: Date): boolean => {
    const status = getDateBookingStatus(date);
    return status === 'busy' || status === 'full';
  };

  // Check if date is in the past
  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if date is before minimum date
  const isDateBeforeMin = (date: Date): boolean => {
    if (!minDate) return false;
    const minDateTime = new Date(minDate);
    minDateTime.setHours(0, 0, 0, 0);
    return date < minDateTime;
  };

  // Check if date is beyond reasonable booking window (2 years) - SAME AS HOMEPAGE
  const isDateTooFar = (date: Date): boolean => {
    const maxBookingDate = new Date();
    maxBookingDate.setFullYear(maxBookingDate.getFullYear() + 2); // 2 years from now
    return date > maxBookingDate;
  };

  // Check if date is selectable (SAME LOGIC AS HOMEPAGE AND BOOKING PAGE)
  const isDateSelectable = (date: Date): boolean => {
    const bookingStatus = getDateBookingStatus(date);
    const isPast = isDateInPast(date);
    const isBeforeMin = isDateBeforeMin(date);
    const isTooFar = isDateTooFar(date);
    const isBlocked = isDateBlocked(date);
    
    // Past dates, dates before minimum, dates too far in future, and blocked dates are never selectable
    if (isPast || isBeforeMin || isTooFar || isBlocked) return false;
    
    // Check-in and check-out dates are selectable (guests can arrive after previous guest leaves)
    // This is KEY - same-day turnovers are allowed in the main booking system
    if (bookingStatus === 'checkin' || bookingStatus === 'checkout') return true;
    
    // Available dates are selectable
    if (bookingStatus === 'available') return true;
    
    // Busy (occupied) and full dates are NOT selectable
    if (bookingStatus === 'busy' || bookingStatus === 'full') return false;
    
    return false;
  };

  // Check if a date should be blocked (current booking dates that can't be selected for reschedule)
  const isDateBlocked = (date: Date): boolean => {
    // If we're in rescheduling mode, don't block current booking dates - allow flexible selection
    if (isRescheduling) return false;
    
    if (!selectedCheckIn || !selectedCheckOut || !excludeBookingId) return false;
    
    // Use local date components to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${day}`;
    
    // Block the current booking dates (check-in and stay dates, but not check-out)
    // For Nov 27-29 booking: block Nov 27 and Nov 28, allow Nov 29
    const isBlocked = targetDateStr >= selectedCheckIn && targetDateStr < selectedCheckOut;
    
    if (isBlocked) {
      console.log(`🚫 [isDateBlocked] Blocking ${targetDateStr} (current booking: ${selectedCheckIn} to ${selectedCheckOut})`);
    }
    
    return isBlocked;
  };

  // Check if date is in selected range (for visual range highlighting)
  const isDateInSelectedRange = (date: Date): boolean => {
    if (!newCheckIn || selectionMode !== 'check-out') return false;
    
    const checkInDate = new Date(newCheckIn);
    const targetDate = new Date(date);
    
    return targetDate > checkInDate && isDateSelectable(date) && !isDateBlocked(date);
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    // Use local date components to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Check if date is selectable
    if (!isDateSelectable(date) || isDateBlocked(date)) {
      return;
    }

    if (selectionMode === 'check-in') {
      // Set new check-in
      setNewCheckIn(dateString);
      setNewCheckOut(''); // Clear check-out
      setSelectionMode('check-out');
      onDateSelect(dateString, ''); // Update parent with check-in only
    } else {
      // Set new check-out
      if (newCheckIn && date > new Date(newCheckIn)) {
        setNewCheckOut(dateString);
        setSelectionMode('check-in'); // Reset for next selection
        onDateSelect(newCheckIn, dateString); // Update parent with both dates
      } else {
        // Reset and start over if invalid check-out
        setNewCheckIn('');
        setNewCheckOut('');
        setSelectionMode('check-in');
        onDateSelect('', '');
      }
    }
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // End at Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const currentDateIter = new Date(startDate);
    
    while (currentDateIter <= endDate) {
      days.push(new Date(currentDateIter));
      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }
    
    return days;
  };

  // Get date style classes with sophisticated styling
  const getDateClasses = (date: Date) => {
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const isToday = date.toDateString() === new Date().toDateString();
    // Use local date components to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const isSelected = newCheckIn === dateStr || newCheckOut === dateStr;
    const isInRange = isDateInSelectedRange(date);
    const isSelectable = isDateSelectable(date);
    const bookingStatus = getDateBookingStatus(date);
    const isPast = isDateInPast(date);
    const isBlocked = isDateBlocked(date);

    // Base classes for responsive calendar styling - premium clean design
    let classes = 'w-full aspect-square flex items-center justify-center text-sm sm:text-base lg:text-lg font-bold rounded-lg transition-all duration-200 cursor-pointer relative border-2 ';

    if (!isCurrentMonth) {
      classes += 'text-gray-500 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-40 ';
    } else if (isBlocked) {
      // Blocked dates (current booking) - distinctive blocked styling with no pointer cursor
      // Note: In reschedule mode, isDateBlocked() returns false, so this won't trigger
      classes += 'bg-gradient-to-br from-gray-400 to-gray-500 text-white cursor-not-allowed border-gray-400 opacity-75 pointer-events-none ';
    } else if (!isSelectable) {
      // Handle booking status display for non-selectable dates (but show proper colors)
      classes += 'cursor-not-allowed ';
      
      switch (bookingStatus) {
        case 'checkin':
          // Check-in dates - sophisticated blue gradient (even if not selectable for rescheduling)
          classes += 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500 shadow-md ';
          break;
        case 'checkout':
          // Check-out dates - sophisticated red gradient (even if not selectable for rescheduling)  
          classes += 'bg-gradient-to-br from-red-600 to-red-700 text-white border-red-500 shadow-md ';
          break;
        case 'busy':
          // Occupied dates - sophisticated yellow gradient (resort is occupied)
          classes += 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-yellow-500/50 ';
          break;
        case 'full':
          // Full day bookings - sophisticated purple gradient (same-day booking)
          classes += 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg border-purple-400 ';
          break;
        default:
          // Other non-selectable dates
          classes += 'bg-gray-700 text-gray-400 opacity-60 border-gray-600/30 ';
      }
    } else if (isPast) {
      // Past dates - disabled styling
      classes += 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed border-gray-600/30 ';
    } else if (isSelected) {
      // Selected dates - sophisticated orange gradient with glow
      classes += 'bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold shadow-xl border-orange-400 ring-2 ring-orange-400/30 ';
    } else if (bookingStatus === 'checkin') {
      // Check-in dates - sophisticated blue gradient
      classes += 'bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 border-blue-500 hover:border-blue-400 shadow-md hover:shadow-lg transform hover:scale-105 ';
    } else if (bookingStatus === 'checkout') {
      // Check-out dates - sophisticated red gradient
      classes += 'bg-gradient-to-br from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 border-red-500 hover:border-red-400 shadow-md hover:shadow-lg transform hover:scale-105 ';
    } else if (isInRange) {
      // Date range - sophisticated blue range styling
      classes += 'bg-gradient-to-br from-blue-200 to-blue-300 text-blue-800 border-blue-300 shadow-md ';
    } else if (isToday) {
      // Today - sophisticated green gradient
      classes += 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold border-emerald-400 shadow-lg ';
    } else {
      // Open dates - sophisticated green gradient
      classes += 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 border-emerald-500 hover:border-emerald-400 shadow-md hover:shadow-lg transform hover:scale-105 ';
    }

    return classes;
  };

  // Get date status indicator
  const getDateStatusIndicator = (date: Date) => {
    const bookingStatus = getDateBookingStatus(date);
    const isPast = isDateInPast(date);
    // Use local date components to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const isSelected = newCheckIn === dateStr || newCheckOut === dateStr;
    const isInRange = isDateInSelectedRange(date);
    const isBlocked = isDateBlocked(date);

    // Priority order: Selected dates first, then booking status
    // Show full labels for clarity
    if (isSelected && newCheckIn === dateStr) return 'CHECK-IN';
    if (isSelected && newCheckOut === dateStr) return 'CHECK-OUT';
    
    // Don't show labels for past, blocked, or range dates - colors are enough
    if (isBlocked || isPast || isInRange) return null;
    
    // Booking status indicators - full words
    switch (bookingStatus) {
      case 'checkin': return 'CHECK-IN';
      case 'checkout': return 'CHECK-OUT';
      case 'busy': return 'OCCUPIED';
      case 'full': return 'OCCUPIED';
      case 'available': return 'AVAILABLE';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
      {/* Calendar Header - Responsive */}
      <div className="flex items-center justify-between p-2 sm:p-4 lg:p-5 bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1.5 sm:p-2 lg:p-3 rounded-full bg-gray-700/60 hover:bg-gray-600/80 transition-all duration-200 active:scale-95 border border-gray-500/50"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
        </button>
        
        <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white text-center px-2 sm:px-4 py-1 sm:py-2 rounded-lg bg-gray-600/30">
          <span className="hidden xs:inline">{monthNames[currentDate.getMonth()]}</span>
          <span className="xs:hidden">{monthNames[currentDate.getMonth()].slice(0, 3)}</span>
          {' '}{currentDate.getFullYear()}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1.5 sm:p-2 lg:p-3 rounded-full bg-gray-700/60 hover:bg-gray-600/80 transition-all duration-200 active:scale-95 border border-gray-500/50"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
        </button>
      </div>

      {/* Selection Mode Indicator */}
      <div className="px-2 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-gray-600">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300" />
          <p className="text-[11px] sm:text-sm font-medium text-blue-200">
            {selectionMode === 'check-in' ? 'Select check-in date' : 'Select check-out date'}
          </p>
        </div>
      </div>

      {/* Calendar Grid - Premium Layout */}
      <div className="p-3 sm:p-4 lg:p-5">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-gray-400 py-1 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days - Premium Responsive Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2">
          {getCalendarDays().map((date, index) => {
            const statusIndicator = getDateStatusIndicator(date);
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={getDateClasses(date)}
                disabled={!isDateSelectable(date)}
                title={
                  isDateBooked(date) ? 'Not available - Resort is booked' :
                  isDateInPast(date) ? 'Past date - Cannot select' :
                  'Available for booking'
                }
              >
                <span className="relative z-10">{date.getDate()}</span>
                {statusIndicator && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 px-0.5 text-[4px] sm:text-[6px] lg:text-[7px] font-black bg-black/90 text-white rounded shadow-sm whitespace-nowrap leading-tight">
                    {statusIndicator}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend - Clean & Minimal */}
      <div className="border-t border-gray-700 bg-gray-800/90 p-3 sm:p-4">
        {/* Status Legend - Compact Grid */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-x-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm"></div>
            <span className="text-gray-300 text-[11px] sm:text-xs font-medium">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm"></div>
            <span className="text-gray-300 text-[11px] sm:text-xs font-medium">Check-in</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-red-600 to-red-700 shadow-sm"></div>
            <span className="text-gray-300 text-[11px] sm:text-xs font-medium">Check-out</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-sm"></div>
            <span className="text-gray-300 text-[11px] sm:text-xs font-medium">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-600 to-orange-700 shadow-sm ring-1 ring-orange-400"></div>
            <span className="text-gray-300 text-[11px] sm:text-xs font-medium">Selected</span>
          </div>
        </div>

        {/* Selection Status - Only show when dates selected */}
        {(newCheckIn || newCheckOut) && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Check-in</p>
                  <div className="bg-blue-600/20 border border-blue-600/40 rounded-lg px-3 py-2">
                    <p className="text-sm font-semibold text-blue-300">{formatDateSafe(newCheckIn)}</p>
                  </div>
                </div>
                <div className="text-gray-600 text-lg">→</div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Check-out</p>
                  <div className="bg-red-600/20 border border-red-600/40 rounded-lg px-3 py-2">
                    <p className="text-sm font-semibold text-red-300">{formatDateSafe(newCheckOut)}</p>
                  </div>
                </div>
              </div>
              {newCheckIn && newCheckOut && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-gray-400">
                  <Moon className="w-3 h-3" />
                  <span className="text-xs">
                    {(() => {
                      const checkInDate = new Date(newCheckIn + 'T00:00:00');
                      const checkOutDate = new Date(newCheckOut + 'T00:00:00');
                      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
                      return `${nights} night${nights !== 1 ? 's' : ''}`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Guide - Collapsible on Mobile */}
        <details className="mt-3 group">
          <summary className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-gray-300 transition-colors">
            <Info className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">How to read the calendar</span>
            <ChevronRight className="w-3 h-3 ml-auto group-open:rotate-90 transition-transform" />
          </summary>
          <div className="mt-2 bg-gray-900/40 rounded-lg p-3 text-xs text-gray-400 space-y-1.5">
            <div className="flex items-start gap-2">
              <LogIn className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-blue-300">Check-in</strong> — Guest arrives (3:00 PM)</span>
            </div>
            <div className="flex items-start gap-2">
              <LogOut className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-red-300">Check-out</strong> — Guest leaves (1:00 PM)</span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-amber-300">Occupied</strong> — Resort is in use</span>
            </div>
            <div className="flex items-start gap-2">
              <Ban className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-purple-300">Full</strong> — Same-day check-in &amp; out</span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-gray-300">Blocked</strong> — Your current booking</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}