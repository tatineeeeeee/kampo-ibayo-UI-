import { NextResponse } from 'next/server';
import { supabase } from '../../../supabaseClient';

export async function GET() {
  try {
    // Get all bookings with payment information
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        total_amount,
        payment_status,
        payment_intent_id,
        created_at,
        updated_at,
        status,
        guest_name,
        guest_email
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Transform the data to match the payments page format
    const payments = bookings.map((booking) => ({
      id: booking.id,
      user: booking.guest_name || booking.guest_email || 'Unknown User',
      email: booking.guest_email,
      amount: booking.total_amount || 0,
      date: new Date(booking.created_at || '').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      status: getPaymentDisplayStatus(booking.payment_status, booking.status),
      payment_intent_id: booking.payment_intent_id,
      booking_status: booking.status,
      payment_status: booking.payment_status,
      updated_at: booking.updated_at
    }));

    return NextResponse.json({ payments });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to determine display status
function getPaymentDisplayStatus(paymentStatus: string | null, bookingStatus: string | null): string {
  // Priority order: payment_status > booking_status
  
  if (paymentStatus === 'paid') return 'Paid';
  if (paymentStatus === 'processing') return 'Processing';
  if (paymentStatus === 'pending') return 'Pending';
  if (paymentStatus === 'failed') return 'Failed';
  if (paymentStatus === 'refunded') return 'Refunded';
  
  // Fallback to booking status
  if (bookingStatus === 'confirmed') return 'Confirmed';
  if (bookingStatus === 'cancelled') return 'Cancelled';
  if (bookingStatus === 'pending') return 'Pending';
  
  return 'Unknown';
}