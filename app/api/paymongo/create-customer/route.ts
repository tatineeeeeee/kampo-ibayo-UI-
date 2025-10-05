import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone } = body;

    // Check if PayMongo secret key is available
    if (!process.env.PAYMONGO_SECRET_KEY) {
      console.error('PAYMONGO_SECRET_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'PayMongo configuration error' },
        { status: 500 }
      );
    }

    console.log('Creating PayMongo customer for:', email);

    // Create PayMongo customer
    const response = await fetch('https://api.paymongo.com/v1/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from((process.env.PAYMONGO_SECRET_KEY || '') + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            first_name,
            last_name,
            email,
            phone,
            default_device: 'phone'
          }
        }
      }),
    });

    const customerData = await response.json();

    if (!response.ok) {
      console.error('PayMongo Customer Creation Error:', customerData);
      return NextResponse.json(
        { error: 'Failed to create PayMongo customer', details: customerData },
        { status: response.status }
      );
    }

    console.log('PayMongo customer created successfully:', customerData.data.id);

    return NextResponse.json({
      success: true,
      customer_id: customerData.data.id,
      customer: customerData.data
    });

  } catch (error) {
    console.error('Create PayMongo Customer Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}