import { formatPhoneToInternational } from './phoneUtils';
import { formatBookingNumber } from './bookingNumber';

export interface SMSData {
  phone: string;
  message: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS via SMS-Gate.app Cloud API using direct HTTP calls
 * This connects to your Android phone through SMS-Gate servers
 */
export const sendSMS = async (smsData: SMSData): Promise<SMSResponse> => {
  try {
    console.log('📱 Sending SMS via SMS-Gate.app Direct API...');
    console.log('📞 To:', smsData.phone);
    console.log('💬 Message length:', smsData.message.length);

    const username = process.env.SMSGATE_USERNAME;
    const password = process.env.SMSGATE_PASSWORD;

    if (!username || !password) {
      throw new Error('SMS credentials not configured');
    }

    // Ensure phone number is in international format (+63 for Philippines)
    const formattedPhone = formatPhoneToInternational(smsData.phone);
    console.log('📞 Phone conversion:', smsData.phone, '->', formattedPhone);

    // Direct API call to SMS-Gate.app using the WORKING 3rdparty endpoint
    const response = await fetch('https://api.sms-gate.app/3rdparty/v1/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      },
      body: JSON.stringify({
        message: smsData.message,
        phoneNumbers: [formattedPhone]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SMS API Error:', response.status, errorText);
      throw new Error(`SMS API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ SMS sent successfully via SMS-Gate.app');
    console.log('� Response:', result);

    return {
      success: true,
      messageId: result.id || 'sent'
    };

  } catch (error) {
    console.error('❌ SMS sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error sending SMS'
    };
  }
};

/**
 * SMS Message Templates for Kampo Ibayo Resort
 * All messages exactly 160 characters for optimal single SMS delivery
 */
export const createBookingConfirmationSMS = (
  bookingId: string,
  guestName: string,
  checkInDate: string
): string => {
  const formattedBookingNumber = formatBookingNumber(parseInt(bookingId));
  const baseMessage = `KAMPO IBAYO: Hi ${guestName}! Booking ${formattedBookingNumber} received. Please upload payment proof to complete. Check-in: ${checkInDate} 3PM. Thanks!`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

export const createBookingApprovalSMS = (
  bookingId: string,
  guestName: string,
  checkInDate: string
): string => {
  const formattedBookingNumber = formatBookingNumber(parseInt(bookingId));
  const baseMessage = `KAMPO IBAYO: Great news ${guestName}! Booking ${formattedBookingNumber} CONFIRMED! Your getaway awaits on ${checkInDate} at 3PM. See you soon!`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

export const createPaymentApprovedSMS = (
  bookingId: string,
  guestName: string,
  checkInDate: string
): string => {
  const formattedBookingNumber = formatBookingNumber(parseInt(bookingId));
  const baseMessage = `KAMPO IBAYO: Hello ${guestName}! Payment approved for ${formattedBookingNumber}. Booking confirmation pending. Check-in: ${checkInDate} 3PM. Contact: 09662815123`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

export const createBookingReminderSMS = (
  guestName: string,
  checkInDate: string
): string => {
  const baseMessage = `KAMPO IBAYO: Hi ${guestName}! Your relaxing getaway starts tomorrow ${checkInDate} at 3PM. Pool is ready, rooms are clean. Drive safe!`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

export const createBookingCancellationSMS = (
  bookingId: string,
  guestName: string
): string => {
  const formattedBookingNumber = formatBookingNumber(parseInt(bookingId));
  const baseMessage = `KAMPO IBAYO: Hi ${guestName}, booking ${formattedBookingNumber} cancelled. Refund processing 5-10 days. Hope to welcome you soon! Call: 09662815123`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

export const createBookingRescheduleSMS = (
  bookingId: string,
  guestName: string,
  newCheckInDate: string
): string => {
  const formattedBookingNumber = formatBookingNumber(parseInt(bookingId));
  const baseMessage = `KAMPO IBAYO: Hi ${guestName}! Booking ${formattedBookingNumber} rescheduled to ${newCheckInDate}. Upload new payment proof if needed. See you then!`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

export const createPaymentReviewSMS = (
  bookingId: string,
  guestName: string
): string => {
  const formattedBookingNumber = formatBookingNumber(parseInt(bookingId));
  const baseMessage = `KAMPO IBAYO: Hi ${guestName}, payment for ${formattedBookingNumber} needs review. Please resubmit payment proof. Contact: 09662815123`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

export const createCheckInDaySMS = (
  guestName: string,
  checkInTime: string = "3PM"
): string => {
  const baseMessage = `KAMPO IBAYO: Welcome day ${guestName}! Your room is ready for ${checkInTime} check-in. Pool towels & amenities prepared. Drive safe, see you soon!`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

// 12-hour reminder (morning of check-in day)
export const createReminder12HourSMS = (
  guestName: string,
  checkInTime: string = "3PM"
): string => {
  const baseMessage = `KAMPO IBAYO: Hi ${guestName}! Just 12 hours until check-in at ${checkInTime}. Your paradise awaits! Pack your swimsuit & sunblock. See you!`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

// 3-hour reminder (final reminder before check-in)
export const createReminder3HourSMS = (
  guestName: string
): string => {
  const baseMessage = `KAMPO IBAYO: Hi ${guestName}! 3 hours to check-in! Room is ready, pool is clean. We're excited to welcome you! Safe travels. See you very soon!`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};