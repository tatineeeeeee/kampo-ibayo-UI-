import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { guestName, guestEmail, rating, reviewText, stayDates, reviewId } = await request.json();

    // Create transporter (using same config as your existing email system)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Generate star rating display
    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: guestEmail,
      subject: '🎉 Your Review is Now Live - Kampo Ibayo Resort',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px;">🎉 Review Published!</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Your review is now live on our website</p>
            </div>

            <!-- Greeting -->
            <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
              Hi <strong>${guestName}</strong>,
            </p>

            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
              Thank you for taking the time to share your experience! We're excited to let you know that your review has been approved and is now published on our website.
            </p>

            <!-- Review Summary -->
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0;">
              <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">Your Review Summary</h3>
              <div style="margin-bottom: 10px;">
                <strong style="color: #374151;">Rating:</strong> 
                <span style="font-size: 18px; margin-left: 10px;">${stars}</span>
                <span style="color: #6b7280; margin-left: 5px;">(${rating}/5)</span>
              </div>
              ${stayDates ? `<div style="margin-bottom: 10px;"><strong style="color: #374151;">Stay Dates:</strong> <span style="color: #6b7280;">${stayDates}</span></div>` : ''}
              <div style="margin-top: 15px;">
                <strong style="color: #374151;">Your Review:</strong>
                <p style="color: #6b7280; margin: 8px 0 0 0; font-style: italic; line-height: 1.5;">"${reviewText}"</p>
              </div>
            </div>

            <!-- What's Next -->
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">🌟 Your Review Helps Others</h3>
              <p style="color: #374151; margin: 0; line-height: 1.6;">
                Your honest feedback helps future guests make informed decisions and helps us continue improving our services. Thank you for being part of the Kampo Ibayo community!
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://kampoibayo.com'}" 
                 style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Visit Our Website
              </a>
            </div>

            <!-- Social Sharing -->
            <div style="text-align: center; margin: 25px 0;">
              <p style="color: #6b7280; margin-bottom: 15px;">Share your experience with friends:</p>
              <div>
                <a href="https://facebook.com/kampoibayo" style="color: #1877f2; text-decoration: none; margin: 0 10px;">Facebook</a>
                <a href="https://instagram.com/kampoibayo" style="color: #e4405f; text-decoration: none; margin: 0 10px;">Instagram</a>
              </div>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Thank you for choosing Kampo Ibayo Resort<br>
                We look forward to welcoming you back soon!
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0; text-align: center;">
                This is an automated message. Please do not reply to this email.<br>
                Review ID: ${reviewId}
              </p>
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Review approval email sent successfully' });

  } catch (error) {
    console.error('Error sending review approval email:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}