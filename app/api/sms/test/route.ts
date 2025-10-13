import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/app/utils/smsService';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    // Validate input
    if (!phoneNumber || !message) {
      return NextResponse.json({
        success: false,
        error: 'Phone number and message are required'
      }, { status: 400 });
    }

    console.log('📱 Testing SMS service...');
    console.log('📞 Phone:', phoneNumber);
    console.log('💬 Message:', message);

    // Send test SMS
    const result = await sendSMS({ phone: phoneNumber, message });

    if (result.success) {
      console.log('✅ Test SMS sent successfully!');
      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully!',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Test SMS failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test SMS API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET method for testing connectivity
export async function GET() {
  try {
    console.log('🔍 Checking SMS service configuration...');
    
    const username = process.env.SMSGATE_USERNAME;
    const password = process.env.SMSGATE_PASSWORD;

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'SMS credentials not configured'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SMS service configured correctly',
      config: {
        username: username,
        passwordSet: !!password
      }
    });

  } catch (error) {
    console.error('❌ SMS config check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Configuration check failed'
    }, { status: 500 });
  }
}