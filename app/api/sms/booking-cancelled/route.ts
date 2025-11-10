import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/app/utils/smsService';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, bookingDetails } = await request.json();

    // Validate required fields
    if (!phoneNumber || !bookingDetails) {
      return NextResponse.json(
        { error: 'Phone number and booking details are required' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic check)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Format the cancellation message (exactly 160 characters)
    const baseMessage = `KAMPO IBAYO RESORT: Dear ${bookingDetails.name || 'Guest'}, booking ${bookingDetails.booking_number || 'N/A'} has been cancelled. Refund will be processed within 5-10 business days. Call: 09662815123`;
    const message = baseMessage.padEnd(160, ' ').substring(0, 160);

    // Send SMS using existing service
    const result = await sendSMS({
      phone: phoneNumber,
      message: message
    });

    if (result.success) {
      console.log(`Cancellation SMS sent successfully to ${phoneNumber} for booking ${bookingDetails.booking_number}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Cancellation SMS sent successfully',
        messageId: result.messageId 
      });
    } else {
      console.error(`Failed to send cancellation SMS to ${phoneNumber}:`, result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('SMS cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}