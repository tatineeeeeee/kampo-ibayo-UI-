import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { guestName, guestEmail, rejectionReason, resubmissionCount, reviewText, stayDates, reviewId } = await request.json();

    // Create transporter (using same config as your existing email system)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Check if guest has reached maximum attempts
    const isBlocked = resubmissionCount >= 2;
    const remainingAttempts = Math.max(0, 2 - resubmissionCount);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: guestEmail,
      subject: isBlocked 
        ? '📝 Review Submission Limit Reached - Kampo Ibayo Resort'
        : '📝 Review Needs Revision - Kampo Ibayo Resort',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              ${isBlocked 
                ? `<h1 style="color: #dc2626; margin: 0; font-size: 28px;">📝 Submission Limit Reached</h1>
                   <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Maximum review attempts exceeded</p>`
                : `<h1 style="color: #f59e0b; margin: 0; font-size: 28px;">📝 Review Needs Revision</h1>
                   <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">We need you to update your review</p>`
              }
            </div>

            <!-- Greeting -->
            <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
              Hi <strong>${guestName}</strong>,
            </p>

            ${isBlocked ? `
              <!-- Blocked Message -->
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                We appreciate your interest in sharing your experience with us. However, your review submission has reached our maximum attempt limit and cannot be resubmitted at this time.
              </p>

              <!-- Reason -->
              <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 25px 0;">
                <h3 style="color: #b91c1c; margin: 0 0 15px 0; font-size: 18px;">Final Rejection Reason</h3>
                <p style="color: #374151; margin: 0; line-height: 1.6;">${rejectionReason}</p>
              </div>

              <!-- Contact Info -->
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📞 Need to Discuss Your Experience?</h3>
                <p style="color: #374151; margin: 0; line-height: 1.6;">
                  If you'd like to share feedback about your stay or discuss any concerns, please contact our management team directly. We value all guest feedback and want to ensure your voice is heard.
                </p>
                <div style="margin-top: 15px;">
                  <p style="color: #374151; margin: 5px 0;"><strong>Email:</strong> management@kampoibayo.com</p>
                  <p style="color: #374151; margin: 5px 0;"><strong>Phone:</strong> [Your phone number]</p>
                </div>
              </div>
            ` : `
              <!-- Revision Needed Message -->
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                Thank you for taking the time to share your experience with us. We'd love to publish your review, but it needs some adjustments first. Please see the details below and feel free to resubmit.
              </p>

              <!-- Reason -->
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
                <h3 style="color: #d97706; margin: 0 0 15px 0; font-size: 18px;">What Needs to be Updated</h3>
                <p style="color: #374151; margin: 0; line-height: 1.6;">${rejectionReason}</p>
              </div>

              <!-- Attempts Remaining -->
              <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">📝 Resubmission Information</h3>
                <p style="color: #374151; margin: 0 0 10px 0;">
                  <strong>Remaining attempts:</strong> <span style="color: ${remainingAttempts > 0 ? '#059669' : '#dc2626'}; font-weight: bold;">${remainingAttempts}</span>
                </p>
                <p style="color: #6b7280; margin: 0; line-height: 1.6;">
                  You can edit and resubmit your review up to ${remainingAttempts} more time${remainingAttempts !== 1 ? 's' : ''}. After that, you'll need to contact us directly for any feedback.
                </p>
              </div>

              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://kampoibayo.com'}/review" 
                   style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Update My Review
                </a>
              </div>
            `}

            <!-- Original Review -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Your Original Review</h3>
              ${stayDates ? `<div style="margin-bottom: 10px;"><strong style="color: #374151;">Stay Dates:</strong> <span style="color: #6b7280;">${stayDates}</span></div>` : ''}
              <div style="margin-top: 15px;">
                <p style="color: #6b7280; margin: 0; font-style: italic; line-height: 1.5;">"${reviewText}"</p>
              </div>
            </div>

            ${!isBlocked ? `
              <!-- Tips for Better Reviews -->
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">💡 Tips for a Great Review</h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>Be specific about your experience</li>
                  <li>Keep language respectful and constructive</li>
                  <li>Focus on your personal experience</li>
                  <li>Avoid inappropriate content or spam</li>
                </ul>
              </div>
            ` : ''}

            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Thank you for your patience and for choosing Kampo Ibayo Resort<br>
                We value your feedback and look forward to hearing from you!
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0; text-align: center;">
                This is an automated message. Please do not reply to this email.<br>
                Review ID: ${reviewId} | Attempt: ${resubmissionCount + 1}/2
              </p>
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Review rejection email sent successfully' });

  } catch (error) {
    console.error('Error sending review rejection email:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}