import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      payment_method_allowed = ['gcash'], 
      currency = 'PHP',
      capture_type = 'automatic',
      description = 'Kampo Ibayo Booking'
    } = body;

    // Create Payment Intent with PayMongo
    const response = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from((process.env.PAYMONGO_SECRET_KEY || '') + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amount * 100, // Convert to centavos
            payment_method_allowed,
            payment_method_options: {
              card: {
                request_three_d_secure: "any"
              }
            },
            currency,
            capture_type,
            description,
            metadata: {
              booking_description: description
            }
          }
        }
      }),
    });

    const paymentIntentData = await response.json();

    if (!response.ok) {
      console.error('PayMongo Error:', paymentIntentData);
      return NextResponse.json(
        { error: 'Failed to create payment intent', details: paymentIntentData },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      payment_intent: paymentIntentData.data
    });

  } catch (error) {
    console.error('Create Payment Intent Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}