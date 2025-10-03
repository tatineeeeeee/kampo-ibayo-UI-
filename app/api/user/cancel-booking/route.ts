import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, createUserCancellationEmail, createUserCancellationAdminNotification, BookingDetails } from '@/app/utils/emailService';
import { supabase } from '@/app/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, userId, cancellationReason } = body;

    if (!bookingId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get booking details from database and verify ownership
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId) // Ensure user can only cancel their own bookings
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    // Check if booking can be cancelled (only pending or confirmed bookings)
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    // Update booking status to cancelled with user details
    const now = new Date();
    const utcTime = now.getTime();
    const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const philippinesTime = new Date(utcTime + philippinesOffset);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancelled_by: 'user',
        cancelled_at: philippinesTime.toISOString(),
        cancellation_reason: cancellationReason || 'Cancelled by guest'
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    // Prepare email data
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

    // Send confirmation email to guest
    const guestEmail = createUserCancellationEmail(emailBookingDetails);
    const guestEmailResult = await sendEmail(guestEmail);

    // Send notification email to admin with cancellation reason
    const adminEmail = createUserCancellationAdminNotification(emailBookingDetails, cancellationReason);
    const adminEmailResult = await sendEmail(adminEmail);

    // Return success even if emails fail (booking cancellation is more important)
    const emailErrors = [];
    if (!guestEmailResult.success) {
      emailErrors.push(`Guest email failed: ${guestEmailResult.error}`);
    }
    if (!adminEmailResult.success) {
      emailErrors.push(`Admin email failed: ${adminEmailResult.error}`);
    }

    if (guestEmailResult.success && adminEmailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully and notifications sent',
        guestMessageId: guestEmailResult.messageId,
        adminMessageId: adminEmailResult.messageId,
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully',
        warning: 'Some email notifications failed to send',
        emailErrors,
        guestEmailSent: guestEmailResult.success,
        adminEmailSent: adminEmailResult.success,
      });
    }

  } catch (error) {
    console.error('Error in user cancel booking API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}