import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, createBookingConfirmedEmail, BookingDetails } from '@/app/utils/emailService';
import { supabase } from '@/app/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get booking details from database
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update booking status to confirmed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    // Send confirmation email to guest (only if email exists)
    if (booking.guest_email) {
      const emailBookingDetails: BookingDetails = {
        bookingId: booking.id.toString(),
        guestName: booking.guest_name,
        checkIn: new Date(booking.check_in_date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        checkOut: new Date(booking.check_out_date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        guests: booking.number_of_guests,
        totalAmount: booking.total_amount,
        email: booking.guest_email,
      };

      const confirmationEmail = createBookingConfirmedEmail(emailBookingDetails);
      const emailResult = await sendEmail(confirmationEmail);

      if (emailResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Booking confirmed and notification email sent',
          messageId: emailResult.messageId,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Booking confirmed but email failed to send',
          emailError: emailResult.error,
        }, { status: 500 });
      }
    } else {
      // No email available, but booking was still confirmed successfully
      return NextResponse.json({
        success: true,
        message: 'Booking confirmed successfully (no email on file)',
      });
    }

  } catch (error) {
    console.error('Error in confirm booking API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}