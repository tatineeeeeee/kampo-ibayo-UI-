import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabaseAdmin';
import { validateAdminAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
  }

  try {
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);
    // Get the specific booking with all fields
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', parseInt(bookingId))
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
    }

    // Get payment proofs for this booking
    const { data: proofs } = await supabaseAdmin
      .from('payment_proofs')
      .select('*')
      .eq('booking_id', parseInt(bookingId));

    return NextResponse.json({ 
      booking,
      proofs,
      debug: {
        payment_type: booking.payment_type,
        payment_amount: booking.payment_amount,
        total_amount: booking.total_amount,
        hasPaymentType: booking.payment_type !== null,
        hasPaymentAmount: booking.payment_amount !== null
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}