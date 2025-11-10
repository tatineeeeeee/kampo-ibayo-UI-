import { formatPhoneToInternational } from './phoneUtils';

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
  const baseMessage = `KAMPO IBAYO RESORT: Dear ${guestName}, your booking ${bookingId} is confirmed! Check-in date: ${checkInDate} at 2:00 PM. Contact us: 09662815123`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

export const createBookingApprovalSMS = (
  bookingId: string,
  guestName: string,
  checkInDate: string
): string => {
  const baseMessage = `KAMPO IBAYO RESORT: Hi ${guestName}! Great news - booking ${bookingId} approved by admin. Check-in: ${checkInDate} 2PM. We can't wait to see you!`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

export const createBookingReminderSMS = (
  guestName: string,
  checkInDate: string
): string => {
  const baseMessage = `KAMPO IBAYO RESORT: Hello ${guestName}! Friendly reminder: Your amazing stay begins tomorrow ${checkInDate}. Check-in starts at 2PM. Safe travels!`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};

export const createBookingCancellationSMS = (
  bookingId: string,
  guestName: string
): string => {
  const baseMessage = `KAMPO IBAYO RESORT: Dear ${guestName}, booking ${bookingId} has been cancelled. Refund will be processed within 5-10 business days. Call: 09662815123`;
  return baseMessage.padEnd(160, ' ').substring(0, 160);
};