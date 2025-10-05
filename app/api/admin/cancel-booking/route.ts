import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, createBookingCancelledEmail, BookingDetails } from '@/app/utils/emailService';
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

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    // Send cancellation email to guest (only if email exists)
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

      const cancellationEmail = createBookingCancelledEmail(emailBookingDetails);
      const emailResult = await sendEmail(cancellationEmail);

      if (emailResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Booking cancelled and notification email sent',
          messageId: emailResult.messageId,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Booking cancelled but email failed to send',
          emailError: emailResult.error,
        }, { status: 500 });
      }
    } else {
      // No email available, but booking was still cancelled successfully
      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully (no email on file)',
      });
    }

  } catch (error) {
    console.error('Error in cancel booking API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}