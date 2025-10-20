import { NextRequest, NextResponse } from 'next/server';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID is required' }, { status: 400 });
    }

    if (!PAYMONGO_SECRET_KEY) {
      return NextResponse.json({ error: 'PayMongo configuration missing' }, { status: 500 });
    }

    // Fetch payment details from PayMongo
    const paymongoResponse = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paymongoResponse.ok) {
      console.error('PayMongo API error:', paymongoResponse.status, paymongoResponse.statusText);
      return NextResponse.json({ 
        error: 'Failed to fetch payment details from PayMongo' 
      }, { status: paymongoResponse.status });
    }

    const paymongoData = await paymongoResponse.json();
    const paymentIntent = paymongoData.data;

    // Extract relevant payment information
    const paymentDetails = {
      id: paymentIntent.id,
      status: paymentIntent.attributes.status,
      amount: paymentIntent.attributes.amount,
      currency: paymentIntent.attributes.currency,
      description: paymentIntent.attributes.description,
      payment_method_allowed: paymentIntent.attributes.payment_method_allowed,
      payment_method_options: paymentIntent.attributes.payment_method_options,
      capture_type: paymentIntent.attributes.capture_type,
      client_key: paymentIntent.attributes.client_key,
      created_at: paymentIntent.attributes.created_at,
      updated_at: paymentIntent.attributes.updated_at,
      last_payment_error: paymentIntent.attributes.last_payment_error,
      payment_method: paymentIntent.attributes.payment_method,
      payments: paymentIntent.attributes.payments,
      next_action: paymentIntent.attributes.next_action,
    };

    return NextResponse.json({ 
      success: true, 
      payment_details: paymentDetails 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}