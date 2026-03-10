import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, createBookingConfirmationEmail, createAdminNotificationEmail, BookingDetails } from '@/app/utils/emailService';
import { sendSMS, createBookingConfirmationSMS } from '@/app/utils/smsService';
import { validateInternalOrAdmin, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';

interface BookingConfirmationRequest {
  bookingDetails: BookingDetails;
  phoneNumber?: string; // Optional phone number for SMS
}

export async function POST(request: NextRequest) {
  try {
    const auth = await validateInternalOrAdmin(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const body = await request.json();
    const { bookingDetails, phoneNumber } = body as BookingConfirmationRequest;

    // Validate required fields
    if (!bookingDetails || !bookingDetails.email || !bookingDetails.bookingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required booking details' },
        { status: 400 }
      );
    }


    // Send confirmation email to guest
    const guestEmail = createBookingConfirmationEmail(bookingDetails);
    const guestEmailResult = await sendEmail(guestEmail);

    // Send notification email to admin
    const adminEmail = createAdminNotificationEmail(bookingDetails);
    const adminEmailResult = await sendEmail(adminEmail);

    // Send SMS confirmation to guest (if phone number provided)
    let smsResult = null;
    if (phoneNumber) {
      try {
        const smsMessage = createBookingConfirmationSMS(
          bookingDetails.bookingId,
          bookingDetails.guestName,
          bookingDetails.checkIn
        );
        smsResult = await sendSMS({ phone: phoneNumber, message: smsMessage });
      } catch (smsError) {
        console.error('📱 SMS Error (non-critical):', smsError);
        smsResult = { success: false, error: 'SMS service temporarily unavailable' };
      }
    }

    // Determine overall success (email is critical, SMS is optional)
    const emailSuccess = guestEmailResult.success && adminEmailResult.success;
    
    if (emailSuccess) {
      return NextResponse.json({
        success: true,
        message: phoneNumber 
          ? `Booking confirmation sent via email${smsResult?.success ? ' and SMS' : ' (SMS failed)'}`
          : 'Booking confirmation emails sent successfully',
        guestMessageId: guestEmailResult.messageId,
        adminMessageId: adminEmailResult.messageId,
        smsResult: smsResult
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send confirmation emails',
        guestEmailResult,
        adminEmailResult,
        smsResult
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in booking confirmation API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}