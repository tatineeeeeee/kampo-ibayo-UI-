import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, createBookingConfirmationEmail, createAdminNotificationEmail, BookingDetails } from '@/app/utils/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingDetails } = body as { bookingDetails: BookingDetails };

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

    if (guestEmailResult.success && adminEmailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Booking confirmation emails sent successfully',
        guestMessageId: guestEmailResult.messageId,
        adminMessageId: adminEmailResult.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send one or more emails',
        guestEmailResult,
        adminEmailResult,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in booking confirmation email API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}