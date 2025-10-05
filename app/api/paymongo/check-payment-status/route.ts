import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { payment_intent_id } = await request.json();
    
    if (!payment_intent_id) {
      return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 });
    }

    console.log('🔍 Checking PayMongo payment status for:', payment_intent_id);

    // Call PayMongo API to get current payment status
    const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${payment_intent_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ PayMongo API error:', response.status);
      return NextResponse.json({ error: 'Failed to check payment status' }, { status: 400 });
    }

    const paymentData = await response.json();
    const status = paymentData.data.attributes.status;
    const amount = paymentData.data.attributes.amount;
    
    console.log('💳 PayMongo payment status:', status);
    console.log('💰 Payment amount:', amount);

    // Update booking based on actual PayMongo status
    let bookingStatus = 'pending';
    let paymentStatus = 'pending';

    switch (status) {
      case 'succeeded':
        bookingStatus = 'confirmed';
        paymentStatus = 'paid';
        break;
      case 'failed':
      case 'cancelled':
        bookingStatus = 'payment_failed';
        paymentStatus = 'failed';
        break;
      case 'processing':
        bookingStatus = 'pending';
        paymentStatus = 'processing';
        break;
      default:
        bookingStatus = 'payment_failed';
        paymentStatus = 'failed';
    }

    // Update the booking in database
    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({
        status: bookingStatus,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', payment_intent_id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Database update error:', error);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    console.log('✅ Booking status updated:', bookingStatus);

    return NextResponse.json({
      success: true,
      paymongo_status: status,
      booking_status: bookingStatus,
      payment_status: paymentStatus,
      booking: updatedBooking
    });

  } catch (error) {
    console.error('❌ Payment status check error:', error);
    return NextResponse.json(
      { error: 'Payment status check failed' },
      { status: 500 }
    );
  }
}