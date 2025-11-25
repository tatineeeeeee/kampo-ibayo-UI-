import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../app/utils/supabaseAdmin';

/**
 * POST /api/bookings/auto-complete
 * Auto-complete confirmed bookings that have passed their checkout date
 * This runs server-side with admin privileges to bypass RLS
 */
export async function POST() {
  try {
    // Get today's date in YYYY-MM-DD format for accurate comparison
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // e.g., "2025-11-25"

    // Find confirmed bookings where checkout date has passed
    const { data: finishedBookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, guest_name, check_out_date')
      .eq('status', 'confirmed')
      .lte('check_out_date', todayString);

    if (fetchError) {
      console.error('Error fetching finished bookings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', completedCount: 0 },
        { status: 500 }
      );
    }

    if (!finishedBookings || finishedBookings.length === 0) {
      return NextResponse.json({ completedCount: 0 });
    }

    console.log(`Found ${finishedBookings.length} confirmed booking(s) past checkout date`);

    const bookingIds = finishedBookings.map(booking => booking.id);

    // Update all bookings to completed status using admin client
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .in('id', bookingIds);

    if (updateError) {
      console.error('Error auto-completing bookings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bookings', completedCount: 0 },
        { status: 500 }
      );
    }

    console.log(`✅ Auto-completed ${finishedBookings.length} booking(s)`);
    return NextResponse.json({ completedCount: finishedBookings.length });

  } catch (error) {
    console.error('Error in auto-complete endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', completedCount: 0 },
      { status: 500 }
    );
  }
}
