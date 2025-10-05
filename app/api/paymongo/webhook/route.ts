import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PayMongo Webhook received:', body);

    const { data: webhookData } = body;
    
    if (!webhookData || !webhookData.attributes) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    const eventType = webhookData.attributes.type;
    const paymentIntentData = webhookData.attributes.data;
    
    console.log('Webhook event type:', eventType);
    console.log('Payment Intent ID:', paymentIntentData?.id);

    // Handle different webhook events
    switch (eventType) {
      case 'payment.paid':
        await handlePaymentSuccess(paymentIntentData);
        break;
      
      case 'payment.failed':
        await handlePaymentFailure(paymentIntentData);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(paymentIntentData);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(paymentIntentData);
        break;
      
      case 'payment_intent.processing':
        await handlePaymentProcessing(paymentIntentData);
        break;
      
      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentData: { id: string; [key: string]: unknown }) {
  try {
    const paymentIntentId = paymentData.id;
    
    // Update booking status to confirmed and payment status to paid
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntentId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating booking on payment success:', error);
      return;
    }

    console.log('✅ Booking confirmed for payment intent:', paymentIntentId);
    
    // Send confirmation email in background
    sendConfirmationEmail(data);
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentData: { id: string; [key: string]: unknown }) {
  try {
    const paymentIntentId = paymentData.id;
    
    // Update booking status to payment failed
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'payment_failed',
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntentId);

    if (error) {
      console.error('Error updating booking on payment failure:', error);
      return;
    }

    console.log('❌ Payment failed for payment intent:', paymentIntentId);
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentProcessing(paymentData: { id: string; [key: string]: unknown }) {
  try {
    const paymentIntentId = paymentData.id;
    
    // Update payment status to processing
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntentId);

    if (error) {
      console.error('Error updating booking on payment processing:', error);
      return;
    }

    console.log('⏳ Payment processing for payment intent:', paymentIntentId);
    
  } catch (error) {
    console.error('Error handling payment processing:', error);
  }
}

async function sendConfirmationEmail(booking: { id: number; guest_name: string; user_id: string | null; check_in_date: string; check_out_date: string; number_of_guests: number; total_amount: number }) {
  try {
    // Get the user's email from the users table
    let guestEmail = '';
    if (booking.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('auth_id', booking.user_id)
        .single();
      
      guestEmail = userData?.email || '';
    }

    if (!guestEmail) {
      console.warn('No email found for booking:', booking.id);
      return;
    }

    const emailBookingDetails = {
      bookingId: booking.id.toString(),
      guestName: booking.guest_name,
      checkIn: new Date(booking.check_in_date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      checkOut: new Date(booking.check_out_date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      guests: booking.number_of_guests,
      totalAmount: booking.total_amount,
      email: guestEmail,
    };

    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/booking-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingDetails: emailBookingDetails }),
    });

    if (!emailResponse.ok) {
      console.warn('Email sending failed after payment confirmation');
    } else {
      console.log('✅ Confirmation email sent for booking:', booking.id);
    }
  } catch (emailError) {
    console.warn('Email service error after payment confirmation:', emailError);
  }
}