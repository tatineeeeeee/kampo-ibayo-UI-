import { NextResponse } from 'next/server';
import { sendSMS, createBookingReminderSMS, createReminder12HourSMS, createReminder3HourSMS, createCheckInDaySMS } from '@/app/utils/smsService';
import { supabase } from '@/app/supabaseClient';

// Reminder types: 24h, 12h, 3h, checkin (exact 3PM)
type ReminderType = '24h' | '12h' | '3h' | 'checkin';

export async function POST(request: Request) {
  try {
    // Get reminder type from query params or body
    const url = new URL(request.url);
    const reminderType = (url.searchParams.get('type') as ReminderType) || '24h';

    console.log(`🔄 Running ${reminderType} check-in reminder job...`);

    // Calculate the target date based on reminder type
    const now = new Date();
    const philippineOffset = 8 * 60; // UTC+8
    const localNow = new Date(now.getTime() + (philippineOffset + now.getTimezoneOffset()) * 60000);

    let targetDateString: string;
    let checkInHour = 15; // 3PM check-in time

    if (reminderType === '24h') {
      // 24 hours before: check-in is tomorrow
      const tomorrow = new Date(localNow);
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDateString = tomorrow.toISOString().split('T')[0];
    } else if (reminderType === '12h') {
      // 12 hours before 3PM = 3AM same day
      // So we send this reminder at 3AM for same-day check-ins
      targetDateString = localNow.toISOString().split('T')[0];
    } else if (reminderType === '3h') {
      // 3 hours before 3PM = 12PM (noon) same day
      targetDateString = localNow.toISOString().split('T')[0];
    } else if (reminderType === 'checkin') {
      // Exact check-in time (3PM) - same day
      targetDateString = localNow.toISOString().split('T')[0];
    } else {
      targetDateString = localNow.toISOString().split('T')[0];
    }

    console.log(`📅 Checking for bookings with check-in date: ${targetDateString} (${reminderType} reminder)`);

    // Get all confirmed bookings with check-in date matching target
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .eq('check_in_date', targetDateString)
      .not('guest_phone', 'is', null);

    if (fetchError) {
      console.error('❌ Database error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    console.log(`📱 Found ${bookings?.length || 0} bookings for ${reminderType} reminder`);

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No ${reminderType} check-in reminders needed`,
        reminderType,
        remindersSent: 0
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Send reminder SMS to each guest
    for (const booking of bookings) {
      try {
        const checkInDate = new Date(booking.check_in_date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });

        // Select appropriate message based on reminder type
        let reminderMessage: string;
        if (reminderType === '24h') {
          reminderMessage = createBookingReminderSMS(booking.guest_name, checkInDate);
        } else if (reminderType === '12h') {
          reminderMessage = createReminder12HourSMS(booking.guest_name, '3PM');
        } else if (reminderType === '3h') {
          reminderMessage = createReminder3HourSMS(booking.guest_name);
        } else if (reminderType === 'checkin') {
          reminderMessage = createCheckInDaySMS(booking.guest_name, '3PM');
        } else {
          reminderMessage = createBookingReminderSMS(booking.guest_name, checkInDate);
        }

        console.log(`📱 Sending ${reminderType} reminder to ${booking.guest_name} at ${booking.guest_phone}`);

        const smsResult = await sendSMS({
          phone: booking.guest_phone as string,
          message: reminderMessage
        });

        if (smsResult.success) {
          successCount++;
          console.log(`✅ ${reminderType} reminder sent to ${booking.guest_name}`);
        } else {
          errorCount++;
          console.error(`❌ Failed to send ${reminderType} reminder to ${booking.guest_name}:`, smsResult.error);
        }

        results.push({
          bookingId: booking.id,
          guestName: booking.guest_name,
          phone: booking.guest_phone as string,
          reminderType,
          success: smsResult.success,
          error: smsResult.error,
          messageId: smsResult.messageId
        });

        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errorCount++;
        console.error(`❌ Error sending ${reminderType} reminder for booking ${booking.id}:`, error);
        results.push({
          bookingId: booking.id,
          guestName: booking.guest_name,
          phone: booking.guest_phone as string,
          reminderType,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ ${reminderType} reminder job complete: ${successCount} sent, ${errorCount} failed`);

    return NextResponse.json({
      success: true,
      message: `${reminderType} check-in reminders: ${successCount} sent, ${errorCount} failed`,
      reminderType,
      remindersSent: successCount,
      remindersFailed: errorCount,
      totalBookings: bookings.length,
      results: results
    });

  } catch (error) {
    console.error('❌ Check-in reminder job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET method to check what reminders would be sent (for testing)
export async function GET() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0];

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .eq('check_in_date', tomorrowDateString)
      .not('guest_phone', 'is', null);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      checkInDate: tomorrowDateString,
      bookingsFound: bookings?.length || 0,
      bookings: bookings?.map(b => ({
        id: b.id,
        guestName: b.guest_name,
        phone: b.guest_phone as string,
        checkInDate: b.check_in_date
      })) || []
    });

  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}