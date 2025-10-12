import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 PayMongo Webhook received:', JSON.stringify(body, null, 2));

    const { data: webhookData } = body;
    
    if (!webhookData || !webhookData.attributes) {
      console.error('❌ Invalid webhook data structure:', body);
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    const eventType = webhookData.attributes.type;
    const paymentIntentData = webhookData.attributes.data;
    
    console.log('🎯 Webhook event type:', eventType);
    console.log('💳 Payment Intent ID:', paymentIntentData?.id);
    console.log('📊 Full payment data:', JSON.stringify(paymentIntentData, null, 2));

    // Handle different webhook events
    switch (eventType) {
      case 'payment.paid':
        console.log('✅ Processing payment.paid event');
        await handlePaymentSuccess(paymentIntentData);
        break;
      
      case 'payment.failed':
        console.log('❌ Processing payment.failed event');
        await handlePaymentFailure(paymentIntentData);
        break;
      
      case 'source.chargeable':
        console.log('🔄 Processing source.chargeable event');
        // Handle when payment source becomes chargeable
        break;
      
      case 'payment_intent.succeeded':
        console.log('✅ Processing payment_intent.succeeded event');
        await handlePaymentSuccess(paymentIntentData);
        break;
      
      case 'payment_intent.payment_failed':
        console.log('❌ Processing payment_intent.payment_failed event');
        await handlePaymentFailure(paymentIntentData);
        break;
      
      case 'payment_intent.processing':
        console.log('⏳ Processing payment_intent.processing event');
        await handlePaymentProcessing(paymentIntentData);
        break;
      
      case 'payment_intent.cancelled':
      case 'payment_intent.canceled':
        console.log('🚫 Processing payment_intent.cancelled event');
        await handlePaymentFailure(paymentIntentData);
        break;
      
      case 'source.expired':
        console.log('⏰ Processing source.expired event');
        await handlePaymentFailure(paymentIntentData);
        break;
      
      case 'source.failed':
        console.log('❌ Processing source.failed event');
        await handlePaymentFailure(paymentIntentData);
        break;
        await handlePaymentProcessing(paymentIntentData);
        break;
        
      // Handle source events (for test payments that expire)
      case 'source.failed':
        console.log('❌ Processing source.failed event');
        await handlePaymentFailure(paymentIntentData);
        break;
        
      case 'source.cancelled':
        console.log('❌ Processing source.cancelled event');
        await handlePaymentFailure(paymentIntentData);
        break;
        
      case 'source.expired':
        console.log('❌ Processing source.expired event');
        await handlePaymentFailure(paymentIntentData);
        break;
      
      default:
        console.log('⚠️ Unhandled webhook event:', eventType);
        console.log('📝 Available handlers: payment.paid, payment.failed, payment_intent.succeeded, payment_intent.payment_failed, payment_intent.processing, source.failed, source.cancelled, source.expired');
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
    
    // Update payment status to paid, but keep booking as pending for admin approval
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'pending',  // Keep as pending until admin confirms
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntentId);

    if (error) {
      console.error('Error updating booking on payment success:', error);
      return;
    }

    console.log('✅ Payment confirmed for payment intent:', paymentIntentId, '- Awaiting admin approval');
    
    // Confirmation email will be sent when admin approves the booking
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentData: { id: string; [key: string]: unknown }) {
  try {
    const paymentIntentId = paymentData.id;
    console.log('🔍 Looking for booking with payment_intent_id:', paymentIntentId);
    
    // First check if booking exists
    const { data: existingBooking, error: findError } = await supabase
      .from('bookings')
      .select('id, status, payment_intent_id')
      .eq('payment_intent_id', paymentIntentId)
      .single();
      
    if (findError) {
      console.error('❌ Error finding booking for payment failure:', findError);
      console.log('🔍 Searched for payment_intent_id:', paymentIntentId);
      return;
    }
    
    console.log('📋 Found booking to update:', existingBooking);
    
    // Update booking status to payment failed
    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({
        status: 'payment_failed',
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntentId)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error updating booking on payment failure:', error);
      return;
    }

    console.log('✅ Successfully updated booking to payment_failed:', updatedBooking);
    
  } catch (error) {
    console.error('💥 Exception in handlePaymentFailure:', error);
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

// Note: Confirmation email sending has been moved to the admin confirmation process
// in /api/admin/confirm-booking to ensure emails are only sent after admin approval