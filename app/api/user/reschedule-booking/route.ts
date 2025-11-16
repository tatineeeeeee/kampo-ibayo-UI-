import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { bookingId, newCheckIn, newCheckOut, userId } = await request.json();

    // Validate required fields
    if (!bookingId || !newCheckIn || !newCheckOut || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const checkInDate = new Date(newCheckIn);
    const checkOutDate = new Date(newCheckOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return NextResponse.json(
        { success: false, error: "Check-in date cannot be in the past" },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { success: false, error: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }

    // Verify the booking belongs to the user and can be rescheduled
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or access denied" },
        { status: 404 }
      );
    }

    // Check if booking can be rescheduled (same rules as cancellation)
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: "Cannot reschedule a cancelled booking" },
        { status: 400 }
      );
    }

    // For confirmed bookings, check if it's at least 24 hours before check-in
    if (booking.status === 'confirmed') {
      const originalCheckIn = new Date(booking.check_in_date);
      const now = new Date();
      const hoursUntilCheckIn = (originalCheckIn.getTime() - now.getTime()) / (1000 * 3600);
      
      if (hoursUntilCheckIn < 24) {
        return NextResponse.json(
          { success: false, error: "Cannot reschedule less than 24 hours before check-in" },
          { status: 400 }
        );
      }
    }

    // Check if new dates are available (excluding the current booking)
    const { data: conflictingBookings, error: conflictError } = await supabaseAdmin
      .from('bookings')
      .select('id, check_in_date, check_out_date, status')
      .in('status', ['confirmed', 'pending'])
      .neq('id', bookingId); // Exclude current booking

    if (conflictError) {
      console.error('Error checking date conflicts:', conflictError);
      return NextResponse.json(
        { success: false, error: "Error checking date availability" },
        { status: 500 }
      );
    }

    // Check for date conflicts
    const newCheckInTime = new Date(newCheckIn).getTime();
    const newCheckOutTime = new Date(newCheckOut).getTime();

    const hasConflict = conflictingBookings?.some(existingBooking => {
      const existingCheckIn = new Date(existingBooking.check_in_date).getTime();
      const existingCheckOut = new Date(existingBooking.check_out_date).getTime();

      // Check for overlap
      return (
        (newCheckInTime >= existingCheckIn && newCheckInTime < existingCheckOut) ||
        (newCheckOutTime > existingCheckIn && newCheckOutTime <= existingCheckOut) ||
        (newCheckInTime <= existingCheckIn && newCheckOutTime >= existingCheckOut)
      );
    });

    if (hasConflict) {
      return NextResponse.json(
        { success: false, error: "Selected dates are not available" },
        { status: 400 }
      );
    }

    // Calculate new total amount based on new dates
    const calculateMultiDayPrice = (checkInDate: Date, checkOutDate: Date, guestCount: number = 15) => {
      const nights = [];
      const currentNight = new Date(checkInDate);
      
      // Calculate each night between check-in and check-out
      while (currentNight < checkOutDate) {
        const dayOfWeek = currentNight.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
        
        // Simple weekend/holiday logic (can be expanded later)
        const nightRate = isWeekend ? 12000 : 9000;
        
        nights.push({
          date: new Date(currentNight),
          rate: nightRate,
          isWeekend
        });
        
        currentNight.setDate(currentNight.getDate() + 1);
      }
      
      // Calculate total base cost
      const totalBaseRate = nights.reduce((sum, night) => sum + night.rate, 0);
      
      // Add excess guest fee (₱300 per guest over 15, per night)
      const totalNights = nights.length;
      const excessGuestFee = guestCount > 15 ? (guestCount - 15) * 300 * totalNights : 0;
      
      return {
        totalNights,
        totalBaseRate,
        excessGuestFee,
        totalAmount: totalBaseRate + excessGuestFee
      };
    };

    // Calculate new total amount
    const newPricing = calculateMultiDayPrice(checkInDate, checkOutDate, booking.number_of_guests);
    const newTotalAmount = newPricing.totalAmount;

    // Format dates for database (with times)
    const newCheckInDateTime = `${newCheckIn}T15:00:00`; // 3 PM check-in
    const newCheckOutDateTime = `${newCheckOut}T13:00:00`; // 1 PM check-out

    // Update the booking with new dates, new amount, and reset payment status
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        check_in_date: newCheckInDateTime,
        check_out_date: newCheckOutDateTime,
        total_amount: newTotalAmount,
        payment_status: 'pending', // Reset payment status since amount changed
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { success: false, error: "Failed to reschedule booking" },
        { status: 500 }
      );
    }

    // Send notification emails in the background (non-blocking)
    try {
      // Send email notification to guest and admin
      const emailData = {
        bookingId: bookingId,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        originalCheckIn: new Date(booking.check_in_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        originalCheckOut: new Date(booking.check_out_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        newCheckIn: new Date(newCheckInDateTime).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        newCheckOut: new Date(newCheckOutDateTime).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        totalAmount: booking.total_amount,
        guests: booking.number_of_guests
      };

      // Send reschedule confirmation email (fire and forget)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/booking-rescheduled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      }).catch(error => {
        console.warn('Email notification failed:', error);
        // Don't fail the main operation
      });

    } catch (emailError) {
      console.warn('Email service error:', emailError);
      // Don't fail the main reschedule operation
    }

    return NextResponse.json({
      success: true,
      message: "Booking rescheduled successfully! Please upload new payment proof for the updated amount.",
      booking: updatedBooking,
      pricing: {
        originalAmount: booking.total_amount,
        newAmount: newTotalAmount,
        amountDifference: newTotalAmount - booking.total_amount,
        nightsCount: newPricing.totalNights
      },
      requiresNewPayment: true
    });

  } catch (error) {
    console.error('Reschedule booking error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}