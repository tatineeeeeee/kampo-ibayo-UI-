"use client";

import { useState, useEffect } from "react";
import { FaChevronDown, FaCalendarAlt } from "react-icons/fa";
import { supabase } from "../supabaseClient";
import { withAuthGuard } from "../hooks/useAuthGuard";
import { validateUserAction } from "../utils/userValidation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Booking {
  id: number;
  check_in_date: string;
  check_out_date: string;
  status: string | null;
}

function BookingPage() {
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

  // Get today's date in YYYY-MM-DD format (Philippines timezone)
  const [minDate, setMinDate] = useState<Date>(new Date());
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  
  // Calculate unavailable dates for the date picker
  const getUnavailableDates = () => {
    const unavailable: Date[] = [];
    
    existingBookings.forEach(booking => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      
      // Add all dates between check-in and check-out (inclusive of check-in, exclusive of check-out)
      const currentDate = new Date(checkIn);
      while (currentDate < checkOut) {
        unavailable.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return unavailable;
  };
  
  useEffect(() => {
    const today = new Date();
    // Convert to Philippines timezone (UTC+8)
    const philippinesTime = new Date(today.getTime() + (8 * 60 * 60 * 1000));
    setMinDate(philippinesTime);
    
    // Fetch existing bookings
    const fetchExistingBookings = async () => {
      try {
        console.log('🔄 Fetching existing bookings...');
        const { data, error } = await supabase
          .from('bookings')
          .select('id, check_in_date, check_out_date, status')
          .in('status', ['confirmed', 'pending']); // Only active bookings

        console.log('📊 Raw booking data from database:', data);
        console.log('❌ Any errors?', error);

        if (error) {
          console.error('Error fetching bookings:', error);
        } else {
          console.log(`✅ Found ${data?.length || 0} active bookings`);
          setExistingBookings(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    fetchExistingBookings();
  }, []);

  const checkBookingConflict = (checkInDate: Date | null, checkOutDate: Date | null) => {
    if (!checkInDate || !checkOutDate) return false;
    
    console.log('🔎 Conflict check - New booking:', checkInDate.toISOString().split('T')[0], 'to', checkOutDate.toISOString().split('T')[0]);
    
    const newCheckIn = new Date(checkInDate);
    const newCheckOut = new Date(checkOutDate);
    
    const hasConflict = existingBookings.some(booking => {
      const existingCheckIn = new Date(booking.check_in_date);
      const existingCheckOut = new Date(booking.check_out_date);
      
      console.log(`📅 Existing booking: ${booking.id} - ${existingCheckIn.toISOString().split('T')[0]} to ${existingCheckOut.toISOString().split('T')[0]} (Status: ${booking.status})`);
      
      // Check if dates overlap
      const overlaps = (newCheckIn < existingCheckOut) && (newCheckOut > existingCheckIn);
      
      if (overlaps) {
        console.log('❌ CONFLICT DETECTED with booking', booking.id);
      }
      
      return overlaps;
    });
    
    console.log('🔍 Final conflict result:', hasConflict);
    return hasConflict;
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
    
    // First, validate that the user account still exists
    const validation = await validateUserAction();
    if (!validation.isValid) {
      return; // User will be redirected automatically
    }
    
    // Validate all required fields
    if (!formData.name.trim()) {
      alert('Please enter your full name');
      return;
    }
    
    if (!formData.email.trim()) {
      alert('Please enter your email address');
      return;
    }
    
    if (!formData.guests) {
      alert('Please select number of guests');
      return;
    }
    
    // Validate dates are selected
    if (!formData.checkIn || !formData.checkOut) {
      alert('Please select both check-in and check-out dates');
      return;
    }
    
    // Validate check-out is after check-in
    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      alert('Check-out date must be after check-in date');
      return;
    }
    
    // Check for booking conflicts
    console.log('🔍 Checking conflicts for:', formData.checkIn, 'to', formData.checkOut);
    console.log('📋 Existing bookings:', existingBookings);
    
    if (checkBookingConflict(formData.checkIn, formData.checkOut)) {
      alert('Sorry, these dates are not available. Please choose different dates.');
      return;
    }
    
    // Automatically add times to the selected dates (Option 3)
    const checkInDateTime = `${formData.checkIn!.toISOString().split('T')[0]}T14:00:00`; // 2 PM
    const checkOutDateTime = `${formData.checkOut!.toISOString().split('T')[0]}T12:00:00`; // 12 PM
    
    // Get current user or use a default guest UUID
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'; // Default guest UUID
    
    const bookingData = {
      user_id: userId,
      guest_name: formData.name.trim(),
      guest_email: formData.email.trim(),
      guest_phone: formData.phone.trim() || null,
      number_of_guests: parseInt(formData.guests),
      check_in_date: checkInDateTime,
      check_out_date: checkOutDateTime,
      brings_pet: formData.pet,
      special_requests: formData.request.trim() || null,
      status: 'pending',
      total_amount: 9000 // You can calculate this based on duration
    };
    
    console.log('Attempting to insert booking data:', bookingData);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([bookingData]);
        
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Error creating booking: ${error.message || 'Unknown error'}. Please try again.`);
      } else {
        alert('Reservation submitted successfully! Check-in: 2 PM, Check-out: 12 PM');
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          guests: "",
          checkIn: null,
          checkOut: null,
          pet: false,
          request: "",
        });
        // Refresh availability - reload the page or refetch
        window.location.reload();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Unexpected error creating booking. Please try again.');
    }
  };

  return (
    <>
      <style jsx global>{`
        .react-datepicker {
          background-color: #1f2937 !important;
          border: none !important;
          color: white !important;
          font-family: inherit !important;
          border-radius: 0.375rem !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        .react-datepicker__header {
          background-color: #111827 !important;
          border-bottom: 1px solid #374151 !important;
          border-radius: 0.375rem 0.375rem 0 0 !important;
        }
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: white !important;
          font-weight: 600 !important;
        }
        .react-datepicker__day {
          color: white !important;
          border-radius: 0.25rem !important;
          margin: 0.1rem !important;
          border: none !important;
        }
        .react-datepicker__day:hover {
          background-color: transparent !important;
          border: none !important;
        }
        .react-datepicker__day--selected {
          background-color: #dc2626 !important;
          color: white !important;
          border-radius: 0.25rem !important;
          border: none !important;
        }
        .react-datepicker__day--excluded {
          color: #9ca3af !important;
          text-decoration: line-through;
          background-color: transparent !important;
          border: none !important;
        }
        .react-datepicker__day--excluded:hover {
          background-color: transparent !important;
          cursor: not-allowed !important;
          border: none !important;
        }
        .react-datepicker__day--disabled {
          color: #6b7280 !important;
          background-color: transparent !important;
          border: none !important;
        }
        .react-datepicker__navigation {
          top: 13px !important;
          border: none !important;
        }
        .react-datepicker__navigation--previous {
          border-right-color: white !important;
          border-left: none !important;
          border-top: none !important;
          border-bottom: none !important;
        }
        .react-datepicker__navigation--next {
          border-left-color: white !important;
          border-right: none !important;
          border-top: none !important;
          border-bottom: none !important;
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
      `}</style>
      <main
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-6"
      style={{
        backgroundImage:
          "url('/pool.jpg')", // replace with your background image
      }}
    >
      <div className="bg-gray-900 bg-opacity-90 text-white rounded-lg shadow-2xl w-full max-w-2xl p-8">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-6">Book your Stay</h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2"
              required
               placeholder="e.g. John Doe"
            />
          </div>

          {/* Email + Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2"
                required
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2"
                placeholder="e.g. +63 912 345 6789"              
              />
            </div>
          </div>

          {/* Guests */}
{/* Guests */}
<div>
  <label className="block text-sm font-medium mb-1">
    Number of Guest
  </label>
  <div className="relative">
    <select
      name="guests"
      value={formData.guests}
      onChange={handleChange}
      className="w-full appearance-none rounded-md bg-gray-800 border border-gray-700 px-4 py-2 text-white"
    >
      <option value="">Select number of Guest</option>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
        <option key={num} value={num}>
          {num}
        </option>
      ))}
    </select>

    {/* Custom dropdown icon */}
    <FaChevronDown
      className="pointer-events-none absolute inset-y-0 right-3 my-auto text-gray-400"
    />
  </div>
</div>


          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Check-in Date
              </label>
              <div className="relative">
                <DatePicker
                  selected={formData.checkIn}
                  onChange={(date: Date | null) => setFormData({ ...formData, checkIn: date })}
                  minDate={minDate}
                  excludeDates={getUnavailableDates()}
                  placeholderText="Select check-in date"
                  className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2 pr-10 text-white placeholder-gray-400 h-[42px]"
                  wrapperClassName="w-full"
                  required
                  dateFormat="MMM dd, yyyy"
                  showPopperArrow={false}
                />
                <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Check-in time: 2:00 PM</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Check-out Date
              </label>
              <div className="relative">
                <DatePicker
                  selected={formData.checkOut}
                  onChange={(date: Date | null) => setFormData({ ...formData, checkOut: date })}
                  minDate={formData.checkIn ? new Date(formData.checkIn.getTime() + 24 * 60 * 60 * 1000) : minDate}
                  excludeDates={getUnavailableDates()}
                  placeholderText="Select check-out date"
                  className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2 pr-10 text-white placeholder-gray-400 h-[42px]"
                  wrapperClassName="w-full"
                  required
                  dateFormat="MMM dd, yyyy"
                  showPopperArrow={false}
                />
                <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Check-out time: 12:00 PM</p>
            </div>
          </div>

          {/* Pet info */}
          <div>
            <label className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="pet"
                checked={formData.pet}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-red-500 focus:ring-red-500 border-gray-700 rounded"
              />
              <span>
                <span className="block">I will be bringing a pet</span>
                <span className="text-sm text-gray-400">
                  Pets are welcome at no additional cost. Please notify us in
                  advance.
                </span>
              </span>
            </label>
          </div>

          {/* Special Request */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Special Request
            </label>
            <textarea
              name="request"
              value={formData.request}
              onChange={handleChange}
              rows={3}
              placeholder="Any special accommodations or request..."
              className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2"
              
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-md hover:bg-red-700 transition"
          >
            Reserve Now
          </button>
        </form>
      </div>
    </main>
    </>
  );
}

// Wrap the component with auth guard
export default withAuthGuard(BookingPage);
