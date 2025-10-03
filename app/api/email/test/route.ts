import { NextResponse } from 'next/server';
import { testEmailConnection } from '@/app/utils/emailService';

export async function GET() {
  try {
    const result = await testEmailConnection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email configuration is working correctly',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Email configuration test failed',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error testing email connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to test email connection',
      },
      { status: 500 }
    );
  }
}