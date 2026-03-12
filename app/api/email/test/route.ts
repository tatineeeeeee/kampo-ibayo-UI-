import { NextRequest, NextResponse } from 'next/server';
import { testEmailConnection } from '@/app/utils/emailService';
import { validateAdminAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

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