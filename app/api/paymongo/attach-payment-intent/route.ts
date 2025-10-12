import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/app/utils/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payment_intent_id, payment_method_id, bookingId } = body;
    
    // Create return URL with booking ID - use consistent base URL helper
    const baseUrl = getBaseUrl();
    const return_url = `${baseUrl}/booking-confirmation?booking_id=${bookingId}&payment_intent_id=${payment_intent_id}`;

    if (!payment_intent_id || !payment_method_id) {
      return NextResponse.json(
        { error: 'Payment intent ID and payment method ID are required' },
        { status: 400 }
      );
    }

    // Attach Payment Method to Payment Intent
    const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${payment_intent_id}/attach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from((process.env.PAYMONGO_SECRET_KEY || '') + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: payment_method_id,
            return_url
          }
        }
      }),
    });

    const attachData = await response.json();

    if (!response.ok) {
      console.error('PayMongo Attach Error:', attachData);
      return NextResponse.json(
        { error: 'Failed to attach payment method', details: attachData },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      attached_payment: attachData.data,
      checkout_url: attachData.data.attributes.next_action?.redirect?.url || null
    });

  } catch (error) {
    console.error('Attach Payment Intent Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}