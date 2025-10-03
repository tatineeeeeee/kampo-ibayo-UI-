import nodemailer from 'nodemailer';

// Gmail-only transporter configuration (simplified)
export const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    secure: false, // false for 587, true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    }
  });
};

// Email template interfaces
export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface BookingDetails {
  bookingId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  email: string;
}

// Email sending function
export const sendEmail = async (emailData: EmailTemplate) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Booking confirmation email template
export const createBookingConfirmationEmail = (bookingDetails: BookingDetails): EmailTemplate => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - Kampo Ibayo Resort</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #f9fafb;
        }
        .container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #3b82f6;
        }
        .logo {
          font-size: 32px;
          font-weight: 800;
          color: #3b82f6;
          margin-bottom: 16px;
        }
        .header-title {
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          margin: 16px 0 8px 0;
        }
        .header-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }
        .confirmation-badge {
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 700;
          margin: 16px 0;
          display: inline-block;
        }
        .booking-details {
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          border: 1px solid #e2e8f0;
        }
        .details-title {
          color: #1f2937;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 16px 0;
        }
        .detail-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          transition: all 0.2s ease;
        }
        .detail-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .total-amount {
          background: #3b82f6;
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          font-size: 20px;
          font-weight: 800;
          margin: 24px 0;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
        }
        .contact-info {
          background: #eff6ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .contact-title {
          color: #1e40af;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .contact-details {
          background: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏖️ Kampo Ibayo Resort</div>
          <div class="confirmation-badge">✅ BOOKING CONFIRMED</div>
          <h1 class="header-title">Booking Confirmation</h1>
          <p class="header-subtitle">Your reservation is confirmed and ready</p>
        </div>
        
        <p>Dear ${bookingDetails.guestName},</p>
        
        <p>Thank you for choosing Kampo Ibayo Resort! We're excited to confirm your booking and can't wait to welcome you to our beautiful resort.</p>
        
        <div class="booking-details">
          <h3 class="details-title">
            <span>📋</span>
            Booking Details
          </h3>
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Booking ID</div>
              <div class="detail-value">#${bookingDetails.bookingId}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Guest Name</div>
              <div class="detail-value">${bookingDetails.guestName}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-in Date</div>
              <div class="detail-value">${bookingDetails.checkIn}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-out Date</div>
              <div class="detail-value">${bookingDetails.checkOut}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Number of Guests</div>
              <div class="detail-value">${bookingDetails.guests} guest(s)</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Total Days</div>
              <div class="detail-value">${Math.ceil((new Date(bookingDetails.checkOut).getTime() - new Date(bookingDetails.checkIn).getTime()) / (1000 * 3600 * 24))} days</div>
            </div>
          </div>
        </div>
        
        <div class="total-amount">
          Total Amount: ₱${bookingDetails.totalAmount.toLocaleString()}
        </div>
        
        <div class="contact-info">
          <h4 class="contact-title">
            <span>🤝</span>
            Need Help or Have Questions?
          </h4>
          <div class="contact-details">
            <p style="margin: 8px 0;"><strong>📧 Email:</strong> info@kampoibayo.com</p>
            <p style="margin: 8px 0;"><strong>📞 Phone:</strong> +63 123 456 7890</p>
            <p style="margin: 8px 0;"><strong>🕒 Support Hours:</strong> 8:00 AM - 8:00 PM (Philippine Time)</p>
          </div>
          <p style="color: #1e40af; margin: 12px 0 0 0; font-size: 14px;">
            Our team is here to help make your stay unforgettable!
          </p>
        </div>
        
        <p><strong style="color: #059669;">🎉 What's Next?</strong><br>
        We'll be in touch closer to your arrival date with detailed check-in information. Start planning your perfect getaway!</p>
        
        <div class="footer">
          <p><strong>Thank you for choosing Kampo Ibayo Resort</strong></p>
          <p>We look forward to providing you with an exceptional experience!</p>
          <p>&copy; 2025 Kampo Ibayo Resort. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Booking Confirmation - Kampo Ibayo Resort
    
    Dear ${bookingDetails.guestName},
    
    Thank you for choosing Kampo Ibayo Resort! Your booking has been confirmed.
    
    Booking Details:
    - Booking ID: ${bookingDetails.bookingId}
    - Guest Name: ${bookingDetails.guestName}
    - Check-in: ${bookingDetails.checkIn}
    - Check-out: ${bookingDetails.checkOut}
    - Number of Guests: ${bookingDetails.guests}
    - Total Amount: ₱${bookingDetails.totalAmount.toLocaleString()}
    
    For questions or changes, contact us at info@kampoibayo.com or +63 123 456 7890
    
    We look forward to welcoming you!
    
    Kampo Ibayo Resort
  `;

  return {
    to: bookingDetails.email,
    subject: `✅ Booking Confirmed: ${bookingDetails.bookingId} | Kampo Ibayo Resort`,
    html,
    text,
  };
};

// Admin notification email template
export const createAdminNotificationEmail = (bookingDetails: BookingDetails): EmailTemplate => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking Alert - Kampo Ibayo Resort</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #f9fafb;
        }
        .container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #10b981;
        }
        .alert-badge {
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
          display: inline-block;
        }
        .header-title {
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          margin: 16px 0 8px 0;
        }
        .header-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }
        .booking-summary {
          background: #f0fdf4;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          border: 2px solid #10b981;
        }
        .summary-title {
          color: #1f2937;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 16px 0;
        }
        .detail-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #d1fae5;
          transition: all 0.2s ease;
        }
        .detail-card:hover {
          border-color: #10b981;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .revenue-highlight {
          background: #10b981;
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin: 24px 0;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
        }
        .revenue-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .revenue-amount {
          font-size: 28px;
          font-weight: 800;
          margin: 8px 0;
        }
        .contact-section {
          background: #eff6ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .contact-title {
          color: #1e40af;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .contact-email {
          background: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 8px 0;
          font-weight: 600;
          color: #1e40af;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin: 32px 0;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .btn-success {
          background: #10b981;
          color: white;
        }
        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .priority-note {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .priority-title {
          color: #92400e;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="alert-badge">🎉 New Booking</div>
          <h1 class="header-title">New Booking Received!</h1>
          <p class="header-subtitle">A guest has submitted a new reservation request</p>
        </div>
        
        <p><strong>Hello Admin,</strong></p>
        
        <p>Great news! A new booking has been submitted and is waiting for your review and confirmation. Please check the details below and take appropriate action.</p>
        
        <div class="booking-summary">
          <h3 class="summary-title">
            <span>📋</span>
            Booking Summary
          </h3>
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Booking ID</div>
              <div class="detail-value">#${bookingDetails.bookingId}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Guest Name</div>
              <div class="detail-value">${bookingDetails.guestName}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-in Date</div>
              <div class="detail-value">${bookingDetails.checkIn}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-out Date</div>
              <div class="detail-value">${bookingDetails.checkOut}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Number of Guests</div>
              <div class="detail-value">${bookingDetails.guests} people</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Booking Time</div>
              <div class="detail-value">${new Date().toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</div>
            </div>
          </div>
        </div>

        <div class="revenue-highlight">
          <div class="revenue-title">💰 Potential Revenue</div>
          <div class="revenue-amount">₱${bookingDetails.totalAmount.toLocaleString()}</div>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Expected earnings from this booking</p>
        </div>
        
        <div class="contact-section">
          <h4 class="contact-title">
            <span>👤</span>
            Guest Contact Information
          </h4>
          <div class="contact-email">${bookingDetails.email}</div>
          <p style="color: #1e40af; margin: 12px 0 0 0; font-size: 14px;">
            Guest is waiting for booking confirmation. Respond promptly for best experience.
          </p>
        </div>

        <div class="priority-note">
          <h4 class="priority-title">
            <span>⏱️</span>
            Action Required
          </h4>
          <p style="color: #92400e; margin: 0; font-weight: 500;">
            This booking is currently <strong>PENDING</strong> and requires admin confirmation. 
            Please review and confirm or cancel within 24 hours to maintain excellent guest service.
          </p>
        </div>
        
        <div class="action-buttons">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/bookings" class="btn btn-primary">
            <span>📊</span>
            View in Admin Panel
          </a>
          <a href="mailto:${bookingDetails.email}" class="btn btn-success">
            <span>📧</span>
            Contact Guest
          </a>
        </div>
        
        <div class="footer">
          <p><strong>Kampo Ibayo Resort Admin Panel</strong></p>
          <p>This notification was sent automatically from your booking management system.</p>
          <p>&copy; 2025 Kampo Ibayo Resort. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: (process.env.ADMIN_EMAIL || process.env.EMAIL_FROM) as string,
    subject: `🎉 New Booking Alert: ${bookingDetails.bookingId} - ${bookingDetails.guestName}`,
    html,
  };
};

// Test email connectivity
export const testEmailConnection = async () => {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    console.log('✅ Email server connection successful');
    return { success: true, message: 'Email server connection successful' };
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Booking confirmation email template (when admin confirms pending booking)
export const createBookingConfirmedEmail = (bookingDetails: BookingDetails): EmailTemplate => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed - Kampo Ibayo Resort</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #f9fafb;
        }
        .container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #10b981;
        }
        .logo {
          font-size: 32px;
          font-weight: 800;
          color: #10b981;
          margin-bottom: 16px;
        }
        .header-title {
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          margin: 16px 0 8px 0;
        }
        .header-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }
        .confirmed-badge {
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 700;
          margin: 16px 0;
          display: inline-block;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
        }
        .celebration-banner {
          background: #f0fdf4;
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .celebration-text {
          color: #065f46;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }
        .booking-details {
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          border: 1px solid #e2e8f0;
        }
        .details-title {
          color: #1f2937;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 16px 0;
        }
        .detail-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          transition: all 0.2s ease;
        }
        .detail-card:hover {
          border-color: #10b981;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .total-amount {
          background: #10b981;
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          font-size: 20px;
          font-weight: 800;
          margin: 24px 0;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
        }
        .important-info {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .info-title {
          color: #92400e;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .info-list {
          margin: 12px 0 0 0;
          padding-left: 0;
          list-style: none;
        }
        .info-list li {
          background: white;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 8px 0;
          color: #92400e;
          position: relative;
          padding-left: 48px;
        }
        .info-list li::before {
          content: "•";
          color: #f59e0b;
          font-weight: bold;
          position: absolute;
          left: 20px;
          font-size: 18px;
        }
        .contact-info {
          background: #eff6ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .contact-title {
          color: #1e40af;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .contact-details {
          background: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏖️ Kampo Ibayo Resort</div>
          <div class="confirmed-badge">✅ BOOKING CONFIRMED</div>
          <h1 class="header-title">Your Reservation is Confirmed!</h1>
          <p class="header-subtitle">We're excited to welcome you soon</p>
        </div>

        <div class="celebration-banner">
          <p class="celebration-text">🎉 Great news! Your booking has been confirmed by our team</p>
        </div>
        
        <p>Dear ${bookingDetails.guestName},</p>
        
        <p><strong>Fantastic news!</strong> Your booking has been reviewed and confirmed by our team. We're absolutely excited to welcome you to Kampo Ibayo Resort and provide you with an unforgettable experience!</p>
        
        <div class="booking-details">
          <h3 class="details-title">
            <span>📋</span>
            Confirmed Booking Details
          </h3>
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Booking ID</div>
              <div class="detail-value">#${bookingDetails.bookingId}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Guest Name</div>
              <div class="detail-value">${bookingDetails.guestName}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-in Date</div>
              <div class="detail-value">${bookingDetails.checkIn}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-out Date</div>
              <div class="detail-value">${bookingDetails.checkOut}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Number of Guests</div>
              <div class="detail-value">${bookingDetails.guests} guest(s)</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Confirmed Time</div>
              <div class="detail-value">${new Date().toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</div>
            </div>
          </div>
        </div>
        
        <div class="total-amount">
          Total Amount: ₱${bookingDetails.totalAmount.toLocaleString()}
        </div>
        
        <div class="important-info">
          <h4 class="info-title">
            <span>📋</span>
            Important Check-in Information
          </h4>
          <ul class="info-list">
            <li><strong>Valid government-issued ID</strong> required for check-in</li>
            <li><strong>Check-in time:</strong> 2:00 PM onwards</li>
            <li><strong>Check-out time:</strong> 12:00 PM (noon)</li>
            <li><strong>Payment:</strong> Full payment required upon arrival</li>
            <li><strong>Confirmation:</strong> Please bring this email (print or mobile)</li>
          </ul>
        </div>
        
        <div class="contact-info">
          <h4 class="contact-title">
            <span>🤝</span>
            Need Help or Have Questions?
          </h4>
          <div class="contact-details">
            <p style="margin: 8px 0;"><strong>📧 Email:</strong> info@kampoibayo.com</p>
            <p style="margin: 8px 0;"><strong>📞 Phone:</strong> +63 123 456 7890</p>
            <p style="margin: 8px 0;"><strong>🕒 Support Hours:</strong> 8:00 AM - 8:00 PM (Philippine Time)</p>
          </div>
          <p style="color: #1e40af; margin: 12px 0 0 0; font-size: 14px;">
            Our team is here to help make your stay absolutely perfect!
          </p>
        </div>
        
        <p><strong style="color: #059669;">🌟 What's Next?</strong><br>
        Start counting down the days! We'll be ready to welcome you with open arms and provide you with the most relaxing and memorable resort experience.</p>
        
        <div class="footer">
          <p><strong>Thank you for choosing Kampo Ibayo Resort</strong></p>
          <p>We can't wait to make your stay unforgettable!</p>
          <p>&copy; 2025 Kampo Ibayo Resort. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: bookingDetails.email,
    subject: `🎉 Booking Confirmed! ${bookingDetails.bookingId} | Kampo Ibayo Resort`,
    html,
  };
};

// Booking cancellation email template (when admin cancels booking)
export const createBookingCancelledEmail = (bookingDetails: BookingDetails): EmailTemplate => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancelled - Kampo Ibayo Resort</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #f9fafb;
        }
        .container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #ef4444;
        }
        .logo {
          font-size: 32px;
          font-weight: 800;
          color: #ef4444;
          margin-bottom: 16px;
        }
        .header-title {
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          margin: 16px 0 8px 0;
        }
        .header-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }
        .cancelled-badge {
          background: #ef4444;
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 700;
          margin: 16px 0;
          display: inline-block;
          box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
        }
        .apology-banner {
          background: #fef2f2;
          border: 2px solid #ef4444;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .apology-text {
          color: #991b1b;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }
        .booking-details {
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          border: 1px solid #e2e8f0;
        }
        .details-title {
          color: #1f2937;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 16px 0;
        }
        .detail-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          transition: all 0.2s ease;
        }
        .detail-card:hover {
          border-color: #ef4444;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .refund-info {
          background: #eff6ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .refund-title {
          color: #1e40af;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .refund-text {
          background: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
          color: #1e40af;
          font-weight: 500;
        }
        .alternatives-section {
          background: #f0fdf4;
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .alternatives-title {
          color: #065f46;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .alternatives-list {
          margin: 12px 0 0 0;
          padding-left: 0;
          list-style: none;
        }
        .alternatives-list li {
          background: white;
          border: 1px solid #10b981;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 8px 0;
          color: #065f46;
          position: relative;
          padding-left: 48px;
        }
        .alternatives-list li::before {
          content: "•";
          color: #10b981;
          font-weight: bold;
          position: absolute;
          left: 20px;
          font-size: 18px;
        }
        .contact-info {
          background: #eff6ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .contact-title {
          color: #1e40af;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .contact-details {
          background: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏖️ Kampo Ibayo Resort</div>
          <div class="cancelled-badge">❌ BOOKING CANCELLED</div>
          <h1 class="header-title">Booking Cancellation Notice</h1>
          <p class="header-subtitle">We sincerely apologize for any inconvenience</p>
        </div>

        <div class="apology-banner">
          <p class="apology-text">😔 We deeply regret to inform you about this cancellation</p>
        </div>
        
        <p>Dear ${bookingDetails.guestName},</p>
        
        <p>We regret to inform you that your booking has been cancelled due to unforeseen circumstances. We sincerely apologize for any inconvenience this may cause and understand how disappointing this news must be.</p>
        
        <div class="booking-details">
          <h3 class="details-title">
            <span>📋</span>
            Cancelled Booking Details
          </h3>
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Booking ID</div>
              <div class="detail-value">#${bookingDetails.bookingId}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Guest Name</div>
              <div class="detail-value">${bookingDetails.guestName}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Original Check-in</div>
              <div class="detail-value">${bookingDetails.checkIn}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Original Check-out</div>
              <div class="detail-value">${bookingDetails.checkOut}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Number of Guests</div>
              <div class="detail-value">${bookingDetails.guests} guest(s)</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Cancelled Amount</div>
              <div class="detail-value">₱${bookingDetails.totalAmount.toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <div class="refund-info">
          <h4 class="refund-title">
            <span>💰</span>
            Refund Information
          </h4>
          <div class="refund-text">
            If you have made any payments for this booking, we will process your full refund within 3-5 business days. 
            You will receive a separate confirmation email once the refund has been processed to your original payment method.
          </div>
        </div>
        
        <div class="alternatives-section">
          <h4 class="alternatives-title">
            <span>🌟</span>
            We'd Love to Make It Right
          </h4>
          <p style="color: #065f46; margin: 0 0 12px 0;">
            While we understand this is disappointing, we'd like to offer you these alternatives:
          </p>
          <ul class="alternatives-list">
            <li><strong>Reschedule for different dates</strong> with priority booking (subject to availability)</li>
            <li><strong>Receive a booking credit</strong> worth 110% of your original payment for future use</li>
            <li><strong>Get a full refund</strong> processed quickly to your original payment method</li>
            <li><strong>VIP treatment</strong> on your next booking with complimentary upgrades</li>
          </ul>
        </div>
        
        <div class="contact-info">
          <h4 class="contact-title">
            <span>🤝</span>
            Let's Discuss Your Options
          </h4>
          <div class="contact-details">
            <p style="margin: 8px 0;"><strong>📧 Email:</strong> info@kampoibayo.com</p>
            <p style="margin: 8px 0;"><strong>📞 Phone:</strong> +63 123 456 7890</p>
            <p style="margin: 8px 0;"><strong>🕒 Support Hours:</strong> 8:00 AM - 8:00 PM (Philippine Time)</p>
          </div>
          <p style="color: #1e40af; margin: 12px 0 0 0; font-size: 14px;">
            Our team is standing by to help resolve this situation and find the best solution for you.
          </p>
        </div>
        
        <p><strong style="color: #dc2626;">🙏 Our Sincere Apologies</strong><br>
        We understand this cancellation disrupts your plans, and we take full responsibility. We hope to welcome you to Kampo Ibayo Resort in the future and provide you with the exceptional experience you deserve.</p>
        
        <div class="footer">
          <p><strong>Thank you for your understanding</strong></p>
          <p>We hope to serve you better in the future</p>
          <p>&copy; 2025 Kampo Ibayo Resort. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: bookingDetails.email,
    subject: `❌ Booking Cancelled: ${bookingDetails.bookingId} | Kampo Ibayo Resort`,
    html,
  };
};

// User-initiated cancellation email template (guest confirmation)
export const createUserCancellationEmail = (bookingDetails: BookingDetails): EmailTemplate => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cancellation Confirmed - Kampo Ibayo Resort</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #f9fafb;
        }
        .container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #f59e0b;
        }
        .logo {
          font-size: 32px;
          font-weight: 800;
          color: #f59e0b;
          margin-bottom: 16px;
        }
        .header-title {
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          margin: 16px 0 8px 0;
        }
        .header-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }
        .cancelled-badge {
          background: #f59e0b;
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 700;
          margin: 16px 0;
          display: inline-block;
          box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
        }
        .confirmation-banner {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .confirmation-text {
          color: #92400e;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }
        .booking-summary {
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          border: 1px solid #e2e8f0;
        }
        .summary-title {
          color: #1f2937;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 16px 0;
        }
        .detail-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          transition: all 0.2s ease;
        }
        .detail-card:hover {
          border-color: #f59e0b;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .cancelled-amount {
          background: #f59e0b;
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          font-size: 20px;
          font-weight: 800;
          margin: 24px 0;
          box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
        }
        .next-steps {
          background: #f0fdf4;
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .steps-title {
          color: #065f46;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .steps-list {
          margin: 12px 0 0 0;
          padding-left: 0;
          list-style: none;
        }
        .steps-list li {
          background: white;
          border: 1px solid #10b981;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 8px 0;
          color: #065f46;
          position: relative;
          padding-left: 48px;
        }
        .steps-list li::before {
          content: "•";
          color: #10b981;
          font-weight: bold;
          position: absolute;
          left: 20px;
          font-size: 18px;
        }
        .contact-card {
          background: #eff6ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .contact-title {
          color: #1e40af;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .contact-details {
          background: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin: 24px 0;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .btn-success {
          background: #10b981;
          color: white;
        }
        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏖️ Kampo Ibayo Resort</div>
          <div class="cancelled-badge">✅ CANCELLATION CONFIRMED</div>
          <h1 class="header-title">Your Booking Has Been Cancelled</h1>
          <p class="header-subtitle">Cancellation processed successfully</p>
        </div>

        <div class="confirmation-banner">
          <p class="confirmation-text">✅ Your cancellation request has been processed successfully</p>
        </div>
        
        <p>Dear ${bookingDetails.guestName},</p>
        
        <p>We've successfully processed your booking cancellation. While we're sorry to see your plans change, we understand that sometimes these things happen and we're here to help make the process as smooth as possible.</p>
        
        <div class="booking-summary">
          <h3 class="summary-title">
            <span>📋</span>
            Cancelled Booking Summary
          </h3>
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Booking ID</div>
              <div class="detail-value">#${bookingDetails.bookingId}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Guest Name</div>
              <div class="detail-value">${bookingDetails.guestName}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-in Date</div>
              <div class="detail-value">${bookingDetails.checkIn}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-out Date</div>
              <div class="detail-value">${bookingDetails.checkOut}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Number of Guests</div>
              <div class="detail-value">${bookingDetails.guests} guest(s)</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Cancellation Time</div>
              <div class="detail-value">${new Date().toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</div>
            </div>
          </div>
        </div>
        
        <div class="cancelled-amount">
          Cancelled Amount: ₱${bookingDetails.totalAmount.toLocaleString()}
        </div>
        
        <div class="next-steps">
          <h4 class="steps-title">
            <span>💰</span>
            What Happens Next?
          </h4>
          <ul class="steps-list">
            <li><strong>Refund Processing:</strong> If you made any payments, we'll process your refund within 3-5 business days</li>
            <li><strong>Email Confirmation:</strong> You'll receive a separate email once the refund is processed</li>
            <li><strong>No Penalties:</strong> Your cancellation won't affect future reservations with us</li>
            <li><strong>Availability Update:</strong> The dates are now available for other guests</li>
          </ul>
        </div>
        
        <div class="contact-card">
          <h4 class="contact-title">
            <span>🤝</span>
            We're Here to Help
          </h4>
          <div class="contact-details">
            <p style="margin: 8px 0;"><strong>📧 Email:</strong> info@kampoibayo.com</p>
            <p style="margin: 8px 0;"><strong>📞 Phone:</strong> +63 123 456 7890</p>
            <p style="margin: 8px 0;"><strong>🕒 Support Hours:</strong> 8:00 AM - 8:00 PM (Philippine Time)</p>
          </div>
          <p style="color: #1e40af; margin: 12px 0 0 0; font-size: 14px;">
            Have questions about your cancellation or want to rebook for different dates? We're here to help!
          </p>
        </div>

        <div class="action-buttons">
          <a href="mailto:info@kampoibayo.com" class="btn btn-primary">
            <span>📧</span>
            Email Us
          </a>
          <a href="tel:+631234567890" class="btn btn-success">
            <span>📞</span>
            Call Us
          </a>
        </div>

        <p><strong style="color: #059669;">💡 Want to visit us another time?</strong><br>
        We'd love to welcome you to Kampo Ibayo Resort in the future! Check our website for special offers and available dates that might work better for your schedule.</p>
        
        <div class="footer">
          <p><strong>Thank you for considering Kampo Ibayo Resort</strong></p>
          <p>We hope to welcome you in the future for an unforgettable experience!</p>
          <p>&copy; 2025 Kampo Ibayo Resort. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: bookingDetails.email,
    subject: `✅ Cancellation Confirmed: ${bookingDetails.bookingId} | Kampo Ibayo Resort`,
    html,
  };
};

// Admin notification for user-initiated cancellation
export const createUserCancellationAdminNotification = (
  bookingDetails: BookingDetails, 
  cancellationReason?: string
): EmailTemplate => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Guest Cancellation Alert - Kampo Ibayo Resort</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #f9fafb;
        }
        .container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #ef4444;
        }
        .alert-badge {
          background: #ef4444;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
          display: inline-block;
        }
        .header-title {
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          margin: 16px 0 8px 0;
        }
        .header-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }
        .cancellation-reason {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .reason-header {
          color: #92400e;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .reason-text {
          background: white;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          color: #1f2937;
          font-style: italic;
          line-height: 1.5;
          margin: 0;
        }
        .booking-summary {
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          border: 1px solid #e2e8f0;
        }
        .summary-title {
          color: #1f2937;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 16px 0;
        }
        .detail-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          transition: all 0.2s ease;
        }
        .detail-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .revenue-impact {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .revenue-title {
          color: #92400e;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
        }
        .revenue-amount {
          font-size: 32px;
          font-weight: 800;
          color: #dc2626;
          margin: 8px 0;
        }
        .revenue-subtitle {
          color: #92400e;
          font-size: 14px;
          margin: 0;
        }
        .contact-section {
          background: #eff6ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .contact-title {
          color: #1e40af;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .contact-email {
          background: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 8px 0;
          font-weight: 600;
          color: #1e40af;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin: 32px 0;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .btn-success {
          background: #10b981;
          color: white;
        }
        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .recommendations {
          background: #f3f4f6;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .recommendations-title {
          color: #374151;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .recommendations-list {
          margin: 0;
          padding-left: 0;
          list-style: none;
        }
        .recommendations-list li {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 8px 0;
          color: #4b5563;
          position: relative;
          padding-left: 48px;
        }
        .recommendations-list li::before {
          content: "•";
          color: #3b82f6;
          font-weight: bold;
          position: absolute;
          left: 20px;
          font-size: 18px;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="alert-badge">🚨 Action Required</div>
          <h1 class="header-title">🚫 Guest Cancellation Alert</h1>
          <p class="header-subtitle">A guest has cancelled their booking</p>
        </div>
        
        <p><strong>Hello Admin,</strong></p>
        
        <p>A guest has initiated a booking cancellation that requires your immediate attention for refund processing and follow-up actions.</p>
        
        ${cancellationReason ? `
        <div class="cancellation-reason">
          <h4 class="reason-header">
            <span>💬</span>
            Cancellation Reason
          </h4>
          <p class="reason-text">"${cancellationReason}"</p>
        </div>
        ` : ''}
        
        <div class="booking-summary">
          <h3 class="summary-title">
            <span>📋</span>
            Cancelled Booking Details
          </h3>
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Booking ID</div>
              <div class="detail-value">#${bookingDetails.bookingId}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Guest Name</div>
              <div class="detail-value">${bookingDetails.guestName}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-in Date</div>
              <div class="detail-value">${bookingDetails.checkIn}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-out Date</div>
              <div class="detail-value">${bookingDetails.checkOut}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Number of Guests</div>
              <div class="detail-value">${bookingDetails.guests} people</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Cancellation Time</div>
              <div class="detail-value">${new Date().toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</div>
            </div>
          </div>
        </div>

        <div class="revenue-impact">
          <h4 class="revenue-title">💰 Revenue Impact</h4>
          <div class="revenue-amount">-₱${bookingDetails.totalAmount.toLocaleString()}</div>
          <p class="revenue-subtitle">Potential revenue loss from cancellation</p>
        </div>
        
        <div class="contact-section">
          <h4 class="contact-title">
            <span>👤</span>
            Guest Contact Information
          </h4>
          <div class="contact-email">${bookingDetails.email}</div>
          <p style="color: #1e40af; margin: 12px 0 0 0; font-size: 14px;">
            Consider reaching out to understand the situation and offer alternatives.
          </p>
        </div>
        
        <div class="action-buttons">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/bookings" class="btn btn-primary">
            <span>📊</span>
            View in Admin Panel
          </a>
          <a href="mailto:${bookingDetails.email}" class="btn btn-success">
            <span>📧</span>
            Contact Guest
          </a>
        </div>
        
        <div class="recommendations">
          <h4 class="recommendations-title">
            <span>📋</span>
            Recommended Actions
          </h4>
          <ul class="recommendations-list">
            <li><strong>Process refund</strong> if payment was already made</li>
            <li><strong>Follow up with guest</strong> to understand the cancellation reason</li>
            <li><strong>Offer alternatives</strong> such as different dates or special promotions</li>
            <li><strong>Update availability</strong> calendar to reflect the opened dates</li>
            <li><strong>Review patterns</strong> to identify potential booking flow improvements</li>
          </ul>
        </div>
        
        <div class="footer">
          <p><strong>Kampo Ibayo Resort Admin Panel</strong></p>
          <p>This alert was generated automatically by your booking management system.</p>
          <p>&copy; 2025 Kampo Ibayo Resort. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: (process.env.ADMIN_EMAIL || process.env.EMAIL_FROM) as string,
    subject: `🚫 Guest Cancellation Alert: ${bookingDetails.bookingId} - ${bookingDetails.guestName}`,
    html,
  };
};