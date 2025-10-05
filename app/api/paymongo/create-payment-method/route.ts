import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'gcash', billing, userId, reusable = true } = body;

    let paymongoCustomerId = null;

    // If userId is provided, try to get user's paymongo_id from database
    if (userId) {
      console.log('Looking up user with ID:', userId);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('paymongo_id, id, email, auth_id')
        .eq('auth_id', userId)
        .single();

      console.log('User lookup result:', { userData, userError });

      if (userError) {
        console.error('Error looking up user:', userError);
        // Don't fail here, just proceed without customer ID for guest checkout
      } else {
        paymongoCustomerId = userData?.paymongo_id;
        console.log('Found PayMongo customer ID:', paymongoCustomerId);
      }
    }

    console.log('Creating payment method for user:', userId, 'with customer ID:', paymongoCustomerId);

    // Create Payment Method with PayMongo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentMethodAttributes: { [key: string]: any } = {
      type,
      reusable
    };

    // Add billing if provided
    if (billing) {
      paymentMethodAttributes.billing = billing;
    }

    // Add customer if available (for registered users)
    if (paymongoCustomerId) {
      paymentMethodAttributes.customer = paymongoCustomerId;
    }

    const response = await fetch('https://api.paymongo.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from((process.env.PAYMONGO_SECRET_KEY || '') + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: paymentMethodAttributes
        }
      }),
    });

    const paymentMethodData = await response.json();

    if (!response.ok) {
      console.error('PayMongo Error:', paymentMethodData);
      return NextResponse.json(
        { error: 'Failed to create payment method', details: paymentMethodData },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      payment_method: paymentMethodData.data
    });

  } catch (error) {
    console.error('Create Payment Method Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}