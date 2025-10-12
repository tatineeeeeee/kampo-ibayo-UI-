import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, createUserCancellationConfirmationEmail, createUserCancellationAdminNotification, CancellationEmailData, RefundDetails } from '@/app/utils/emailService';
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

    // Check if cancellation is allowed based on time (no cancellation within 24 hours)
    const checkInDate = new Date(booking.check_in_date);
    const currentTime = new Date();
    const hoursUntilCheckIn = (checkInDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilCheckIn < 24) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cancellation is not allowed within 24 hours of check-in. Please contact the resort directly for assistance.',
          canCancel: false
        },
        { status: 400 }
      );
    }

    // Check if refund should be processed (only if payment was made)
    let refundResponse = null;
    
    if (booking.payment_status === 'paid' && booking.payment_intent_id) {
      console.log('💰 Processing automatic refund for user cancellation');
      
      try {
        const refundApiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/paymongo/process-refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: booking.id,
            reason: cancellationReason || 'Cancelled by guest',
            refundType: 'partial', // Use cancellation policy
            processedBy: 'user'
          }),
        });

        if (refundApiResponse.ok) {
          refundResponse = await refundApiResponse.json();
          console.log('✅ Refund processed successfully:', refundResponse.refund_amount);
        } else {
          const refundError = await refundApiResponse.text();
          console.error('❌ Refund processing failed:', refundError);
          // Continue with cancellation even if refund fails - admin can process manually
        }
      } catch (refundError) {
        console.error('❌ Refund API error:', refundError);
        // Continue with cancellation even if refund fails
      }
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

    // Send email notifications only if guest has an email address
    let guestEmailResult: { success: boolean; messageId?: string; error?: string } = { success: true };
    let adminEmailResult: { success: boolean; messageId?: string; error?: string } = { success: true };

    if (booking.guest_email && booking.guest_email.trim()) {
      // Always prepare refund details for email (even if no actual refund was processed)
      let refundDetails: RefundDetails | undefined = undefined;
      
      // Calculate what the refund would be based on timing policy
      const downPayment = booking.total_amount * 0.5;
      const checkInDate = new Date(booking.check_in_date);
      const currentTime = new Date();
      const hoursUntilCheckIn = (checkInDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      
      let refundPercentage = 0;
      let refundAmount = 0;
      
      if (hoursUntilCheckIn >= 48) {
        refundPercentage = 100;
        refundAmount = downPayment;
      } else if (hoursUntilCheckIn >= 24) {
        refundPercentage = 50;
        refundAmount = downPayment * 0.5;
      }

      // Use actual refund amount if processed, otherwise use calculated amount
      if (refundResponse && refundResponse.refund_amount > 0) {
        refundAmount = refundResponse.refund_amount;
      }

      // Only include refund details if there should be a refund
      if (refundAmount > 0) {
        refundDetails = {
          refundAmount: refundAmount,
          downPayment: downPayment,
          refundPercentage: refundPercentage,
          processingDays: '5-10 business days',
          refundReason: 'User cancellation'
        };
      }

      // Prepare enhanced email data
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
        cancelledBy: 'user',
        cancellationReason: cancellationReason,
        refundDetails: refundDetails
      };

      // Send enhanced confirmation email to guest
      console.log('📧 Sending cancellation confirmation email to:', booking.guest_email);
      const guestEmail = createUserCancellationConfirmationEmail(cancellationData);
      guestEmailResult = await sendEmail(guestEmail);
      console.log('📤 Guest email result:', guestEmailResult);

      // Send notification email to admin with cancellation reason  
      console.log('🚨 Sending admin notification email');
      const adminBookingDetails = {
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
        email: booking.guest_email
      };
      const adminEmail = createUserCancellationAdminNotification(adminBookingDetails, cancellationReason);
      adminEmailResult = await sendEmail(adminEmail);
      console.log('📤 Admin email result:', adminEmailResult);
    } else {
      console.log('⚠️ No email sent - guest_email is missing or empty:', booking.guest_email);
    }

    // Return success even if emails fail (booking cancellation is more important)
    const emailErrors = [];
    if (!guestEmailResult.success && guestEmailResult.error) {
      emailErrors.push(`Guest email failed: ${guestEmailResult.error}`);
    }
    if (!adminEmailResult.success && adminEmailResult.error) {
      emailErrors.push(`Admin email failed: ${adminEmailResult.error}`);
    }

    // Prepare response based on refund status
    const responseData = {
      success: true,
      message: 'Booking cancelled successfully',
      refund: refundResponse ? {
        processed: true,
        amount: refundResponse.refund_amount,
        message: refundResponse.message
      } : null,
      guestEmailSent: guestEmailResult.success,
      adminEmailSent: adminEmailResult.success,
    };

    if (guestEmailResult.success && adminEmailResult.success) {
      responseData.message = refundResponse 
        ? `Booking cancelled and refund of ₱${refundResponse.refund_amount.toLocaleString()} processed. Notifications sent.`
        : 'Booking cancelled successfully and notifications sent';
      return NextResponse.json(responseData);
    } else {
      responseData.message = refundResponse 
        ? `Booking cancelled and refund of ₱${refundResponse.refund_amount.toLocaleString()} processed.`
        : 'Booking cancelled successfully';
      
      if (emailErrors.length > 0) {
        return NextResponse.json({
          ...responseData,
          warning: 'Some email notifications failed to send',
          emailErrors,
        });
      }
      
      return NextResponse.json(responseData);
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