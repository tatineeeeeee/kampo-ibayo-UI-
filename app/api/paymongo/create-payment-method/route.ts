import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, billing, customer_id, reusable = true } = body;

    // Get user's paymongo_id from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('paymongo_id')
      .eq('auth_id', customer_id)
      .single();

    if (userError || !userData?.paymongo_id) {
      return NextResponse.json(
        { error: 'User not found or no PayMongo customer ID' },
        { status: 404 }
      );
    }

    // Create Payment Method with PayMongo
    const response = await fetch('https://api.paymongo.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from((process.env.PAYMONGO_SECRET_KEY || '') + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type,
            billing,
            customer: userData.paymongo_id,
            reusable
          }
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