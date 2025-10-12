import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../supabaseClient';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payment_intent_id } = body;

    if (!payment_intent_id) {
      return NextResponse.json({ error: 'Payment Intent ID is required' }, { status: 400 });
    }

    console.log('🔍 Checking payment status for:', payment_intent_id);

    // First, get the current booking data from database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('payment_intent_id', payment_intent_id)
      .single();

    if (bookingError) {
      console.error('❌ Error fetching booking:', bookingError);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check payment status with PayMongo API
    try {
      const paymongoResponse = await fetch(`https://api.paymongo.com/v1/payment_intents/${payment_intent_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!paymongoResponse.ok) {
        console.error('❌ PayMongo API error:', paymongoResponse.status, paymongoResponse.statusText);
        // Return current booking status if PayMongo API fails
        return NextResponse.json({
          booking,
          payment_status: booking.payment_status,
          status: booking.status,
          source: 'database_fallback'
        });
      }

      const paymongoData = await paymongoResponse.json();
      console.log('📊 PayMongo response:', JSON.stringify(paymongoData, null, 2));

      const paymentIntent = paymongoData.data;
      const paymentStatus = paymentIntent.attributes.status;
      const paymentMethods = paymentIntent.attributes.payment_method_allowed || [];
      
      console.log('💳 Payment Intent Status:', paymentStatus);
      console.log('🔄 Payment Methods:', paymentMethods);

      let newBookingStatus = booking.status;
      let newPaymentStatus = booking.payment_status;

      // Map PayMongo statuses to our booking statuses
      switch (paymentStatus) {
        case 'succeeded':
          newBookingStatus = 'confirmed';
          newPaymentStatus = 'paid';
          break;
        case 'processing':
          newBookingStatus = 'pending';
          newPaymentStatus = 'processing';
          break;
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
          newBookingStatus = 'pending';
          newPaymentStatus = 'pending';
          break;
        case 'canceled':
        case 'cancelled':
          newBookingStatus = 'payment_failed';
          newPaymentStatus = 'failed';
          break;
        default:
          // Keep existing status for unknown states
          console.log('⚠️ Unknown payment status:', paymentStatus);
      }

      // Update booking if status has changed
      if (newBookingStatus !== booking.status || newPaymentStatus !== booking.payment_status) {
        console.log(`🔄 Updating booking: ${booking.status} -> ${newBookingStatus}, ${booking.payment_status} -> ${newPaymentStatus}`);
        
        const { data: updatedBooking, error: updateError } = await supabase
          .from('bookings')
          .update({
            status: newBookingStatus,
            payment_status: newPaymentStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id)
          .select('*')
          .single();

        if (updateError) {
          console.error('❌ Error updating booking:', updateError);
          // Return original booking if update fails
          return NextResponse.json({
            booking,
            payment_status: newPaymentStatus,
            status: newBookingStatus,
            source: 'paymongo_api'
          });
        }

        return NextResponse.json({
          booking: updatedBooking,
          payment_status: newPaymentStatus,
          status: newBookingStatus,
          source: 'paymongo_api_updated'
        });
      }

      // No changes needed
      return NextResponse.json({
        booking,
        payment_status: newPaymentStatus,
        status: newBookingStatus,
        source: 'paymongo_api_current'
      });

    } catch (paymongoError) {
      console.error('❌ Error calling PayMongo API:', paymongoError);
      // Return current booking status if PayMongo API call fails
      return NextResponse.json({
        booking,
        payment_status: booking.payment_status,
        status: booking.status,
        source: 'database_fallback'
      });
    }

  } catch (error) {
    console.error('❌ Check payment status error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}