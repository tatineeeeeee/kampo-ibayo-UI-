import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, EmailTemplate } from '@/app/utils/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text } = body as EmailTemplate;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Send email
    const emailResult = await sendEmail({ to, subject, html, text });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageId: emailResult.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: emailResult.error,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in send email API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}