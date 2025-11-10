import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, createAdminCancellationGuestEmail, CancellationEmailData, RefundDetails } from '@/app/utils/emailService';
import { supabase } from '@/app/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, refundProcessed = false, refundAmount = 0 } = body;

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

    // Update booking status to cancelled with additional details
    const now = new Date();
    const utcTime = now.getTime();
    const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const philippinesTime = new Date(utcTime + philippinesOffset);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancelled_by: 'admin',
        cancelled_at: philippinesTime.toISOString(),
        cancellation_reason: 'Cancelled by administrator'
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    // Send enhanced cancellation email to guest (only if email exists)
    if (booking.guest_email) {
      // Prepare refund details if refund was processed
      let refundDetails: RefundDetails | undefined = undefined;
      
      if (refundProcessed && refundAmount > 0) {
        const downPayment = booking.total_amount * 0.5;
        refundDetails = {
          refundAmount: refundAmount,
          downPayment: downPayment,
          refundPercentage: Math.round((refundAmount / downPayment) * 100),
          processingDays: '5-10 business days',
          refundReason: 'Admin cancellation'
        };
      }

      const cancellationData: CancellationEmailData = {
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
        cancelledBy: 'admin',
        cancellationReason: 'Cancelled by resort administration',
        refundDetails: refundDetails
      };

      const cancellationEmail = createAdminCancellationGuestEmail(cancellationData);
      const emailResult = await sendEmail(cancellationEmail);

      // Send SMS notification if phone number is available (non-blocking)
      let smsResult = null;
      if (booking.guest_phone) {
        try {
          const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sms/booking-cancelled`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber: booking.guest_phone,
              bookingDetails: {
                name: booking.guest_name,
                booking_number: `KB-${booking.id.toString().padStart(4, '0')}`,
                check_in_date: new Date(booking.check_in_date).toLocaleDateString(),
                check_out_date: new Date(booking.check_out_date).toLocaleDateString(),
                number_of_guests: booking.number_of_guests,
                refund_status: refundProcessed ? 'processing' : null
              },
              reason: 'Cancelled by resort administration',
              cancelledBy: 'Admin'
            }),
          });
          
          if (smsResponse.ok) {
            smsResult = await smsResponse.json();
            console.log('Cancellation SMS sent successfully');
          }
        } catch (smsError) {
          console.error('Failed to send cancellation SMS (non-blocking):', smsError);
          // SMS failure doesn't affect the overall operation
        }
      }

      if (emailResult.success) {
        return NextResponse.json({
          success: true,
          message: refundProcessed 
            ? `Booking cancelled and refund notification sent (₱${refundAmount.toLocaleString()})`
            : 'Booking cancelled and notification email sent',
          messageId: emailResult.messageId,
          smsStatus: smsResult?.success ? 'SMS sent' : 'SMS failed (non-critical)'
        });
      } else {
        return NextResponse.json({
          success: true, // Still success since booking was cancelled
          message: 'Booking cancelled but email failed to send',
          emailError: emailResult.error,
          smsStatus: smsResult?.success ? 'SMS sent' : 'SMS failed (non-critical)'
        });
      }
    } else {
      // No email available, but booking was still cancelled successfully
      return NextResponse.json({
        success: true,
        message: refundProcessed 
          ? `Booking cancelled and refund processed (₱${refundAmount.toLocaleString()}) - no email on file`
          : 'Booking cancelled successfully (no email on file)',
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