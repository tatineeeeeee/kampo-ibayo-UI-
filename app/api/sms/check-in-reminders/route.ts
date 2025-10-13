import { NextResponse } from 'next/server';
import { sendSMS, createBookingReminderSMS } from '@/app/utils/smsService';
import { supabase } from '@/app/supabaseClient';

export async function POST() {
  try {
    console.log('🔄 Running check-in reminder job...');
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    console.log('📅 Checking for bookings with check-in date:', tomorrowDateString);

    // Get all confirmed bookings with check-in date tomorrow
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .eq('check_in_date', tomorrowDateString)
      .not('guest_phone', 'is', null); // Only bookings with phone numbers

    if (fetchError) {
      console.error('❌ Database error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    console.log(`📱 Found ${bookings?.length || 0} bookings for tomorrow with phone numbers`);

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No check-in reminders needed for tomorrow',
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

        const reminderMessage = createBookingReminderSMS(
          booking.guest_name,
          checkInDate
        );

        console.log(`📱 Sending reminder to ${booking.guest_name} at ${booking.guest_phone}`);

        const smsResult = await sendSMS({ 
          phone: booking.guest_phone as string, 
          message: reminderMessage 
        });

        if (smsResult.success) {
          successCount++;
          console.log(`✅ Reminder sent to ${booking.guest_name}`);
        } else {
          errorCount++;
          console.error(`❌ Failed to send reminder to ${booking.guest_name}:`, smsResult.error);
        }

        results.push({
          bookingId: booking.id,
          guestName: booking.guest_name,
          phone: booking.guest_phone as string,
          success: smsResult.success,
          error: smsResult.error,
          messageId: smsResult.messageId
        });

        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errorCount++;
        console.error(`❌ Error sending reminder for booking ${booking.id}:`, error);
        results.push({
          bookingId: booking.id,
          guestName: booking.guest_name,
          phone: booking.guest_phone as string,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Reminder job complete: ${successCount} sent, ${errorCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Check-in reminders processed: ${successCount} sent, ${errorCount} failed`,
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