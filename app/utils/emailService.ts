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

export interface RefundDetails {
  refundAmount: number;
  downPayment: number;
  refundPercentage: number;
  processingDays: string;
  refundReason: string;
}

export interface CancellationEmailData extends BookingDetails {
  cancellationReason?: string;
  cancelledBy: 'user' | 'admin';
  refundDetails?: RefundDetails;
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

// Professional booking confirmation email template
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
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #2d3748;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background: #f7fafc;
        }
        .container {
          background: white;
          margin: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: #2b6cb0;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .company-logo {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        .header-title {
          color: white;
          font-size: 24px;
          font-weight: 600;
          margin: 10px 0;
        }
        .header-subtitle {
          color: #e2e8f0;
          font-size: 14px;
          margin: 0;
        }
        .confirmation-status {
          background: #059669;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin: 15px 0;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .content-section {
          padding: 30px;
        }
        .booking-details {
          background: #f8fafc;
          border-left: 4px solid #2b6cb0;
          padding: 20px;
          margin: 20px 0;
        }
        .section-title {
          color: #2d3748;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 15px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 15px 0;
        }
        .detail-item {
          padding: 12px;
          background: white;
          border: 1px solid #e2e8f0;
        }
        .detail-label {
          font-size: 12px;
          color: #718096;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
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
          <div class="company-logo">KAMPO IBAYO RESORT</div>
          <div class="confirmation-status">BOOKING CONFIRMED</div>
          <h1 class="header-title">Reservation Confirmation</h1>
          <p class="header-subtitle">Thank you for choosing our resort</p>
        </div>
        
        <div class="content-section">
          <p>Dear ${bookingDetails.guestName},</p>
          
          <p>We are pleased to confirm your reservation at Kampo Ibayo Resort. This email serves as your official booking confirmation and receipt.</p>
          
          <div class="booking-details">
            <h3 class="section-title">Reservation Summary</h3>
            
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Confirmation Number</div>
                <div class="detail-value">${bookingDetails.bookingId}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Guest Name</div>
                <div class="detail-value">${bookingDetails.guestName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Check-in Date</div>
                <div class="detail-value">${bookingDetails.checkIn}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Check-out Date</div>
                <div class="detail-value">${bookingDetails.checkOut}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Number of Guests</div>
                <div class="detail-value">${bookingDetails.guests} Guest(s)</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Length of Stay</div>
                <div class="detail-value">${Math.ceil((new Date(bookingDetails.checkOut).getTime() - new Date(bookingDetails.checkIn).getTime()) / (1000 * 3600 * 24))} Night(s)</div>
              </div>
            </div>
        </div>
        
          </div>
          </div>
          
          <div style="background: #2b6cb0; color: white; padding: 15px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: 600;">
            Total Reservation Amount: ₱${bookingDetails.totalAmount.toLocaleString()}
          </div>
          
          <div style="background: #edf2f7; border: 1px solid #cbd5e0; padding: 20px; margin: 20px 0;">
            <h4 style="color: #2d3748; font-size: 14px; font-weight: 600; margin: 0 0 15px 0; text-transform: uppercase; border-bottom: 1px solid #cbd5e0; padding-bottom: 8px;">
              Resort Contact Information
            </h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Email Address:</td>
                <td style="padding: 8px 0; color: #2d3748;">info@kampoibayo.com</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Telephone:</td>
                <td style="padding: 8px 0; color: #2d3748;">+63 123 456 7890</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Business Hours:</td>
                <td style="padding: 8px 0; color: #2d3748;">8:00 AM - 8:00 PM (Philippine Standard Time)</td>
              </tr>
            </table>
          </div>
          
          <div style="margin: 20px 0; padding: 15px; background: #bee3f8; border-left: 4px solid #3182ce; color: #2c5282;">
            <strong>Important Information:</strong><br>
            Please retain this confirmation for your records. Check-in instructions and additional details will be provided closer to your arrival date. For any changes or inquiries regarding your reservation, please contact us using the information provided above.
          </div>
          
          <p style="margin-top: 30px;">Thank you for choosing Kampo Ibayo Resort. We look forward to welcoming you.</p>
          
          <p style="margin-top: 20px; color: #718096; font-size: 14px;">
            Best regards,<br>
            <strong>Reservations Department</strong><br>
            Kampo Ibayo Resort
          </p>
        </div>
        </div>
        
        <div style="background: #2d3748; color: white; padding: 25px; text-align: center; font-size: 12px;">
          <p style="margin: 0 0 10px 0; font-weight: 600;">Kampo Ibayo Resort</p>
          <p style="margin: 0 0 5px 0;">Professional Resort Services</p>
          <p style="margin: 0;">&copy; 2025 Kampo Ibayo Resort. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    RESERVATION CONFIRMATION - KAMPO IBAYO RESORT
    
    Dear ${bookingDetails.guestName},
    
    We are pleased to confirm your reservation at Kampo Ibayo Resort.
    
    RESERVATION DETAILS:
    Booking ID: ${bookingDetails.bookingId}
    Guest Name: ${bookingDetails.guestName}
    Check-in Date: ${bookingDetails.checkIn}
    Check-out Date: ${bookingDetails.checkOut}
    Number of Guests: ${bookingDetails.guests}
    Total Amount: ₱${bookingDetails.totalAmount.toLocaleString()}
    
    CONTACT INFORMATION:
    Email: info@kampoibayo.com
    Phone: +63 123 456 7890
    Business Hours: 8:00 AM - 8:00 PM (Philippine Time)
    
    Please retain this confirmation for your records.
    
    Kampo Ibayo Resort
    © 2025 All rights reserved.
  `;

  return {
    to: bookingDetails.email,
    subject: `Reservation Confirmation - Booking ${bookingDetails.bookingId} | Kampo Ibayo Resort`,
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
            <li><strong>Check-in time:</strong> 3:00 PM onwards</li>
            <li><strong>Check-out time:</strong> 1:00 PM</li>
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

// Professional Admin Notification for User-Initiated Cancellation
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
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #2d3748;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background: #f7fafc;
        }
        .container {
          background: white;
          margin: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .company-logo {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        .alert-status {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin: 15px 0;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-title {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin: 10px 0;
        }
        .header-subtitle {
          color: #fecaca;
          font-size: 14px;
          margin: 0;
        }
        .content-section {
          padding: 30px;
        }
        .priority-notice {
          background: #fef2f2;
          border-left: 4px solid #dc2626;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .priority-notice-title {
          color: #dc2626;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 10px 0;
        }
        .priority-notice-text {
          color: #991b1b;
          margin: 0;
        }
        .cancellation-reason {
          background: #fefefe;
          border: 1px solid #e2e8f0;
          padding: 20px;
          margin: 20px 0;
        }
        .reason-header {
          color: #2d3748;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }
        .reason-text {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 15px;
          color: #2d3748;
          line-height: 1.6;
          margin: 0;
          font-style: normal;
        }
        .booking-info-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        .booking-info-table th {
          background: #2b6cb0;
          color: white;
          padding: 12px 15px;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid #e2e8f0;
        }
        .booking-info-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e2e8f0;
          color: #2d3748;
        }
        .booking-info-table tr:nth-child(even) {
          background: white;
        }
        .booking-info-table tr:nth-child(odd) {
          background: #f8fafc;
        }
        .status-tag {
          background: #dc2626;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .amount-highlight {
          color: #dc2626;
          font-weight: 700;
        }
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
          <div class="company-logo">KAMPO IBAYO RESORT</div>
          <div class="alert-status">GUEST CANCELLATION ALERT</div>
          <h1 class="header-title">Booking Cancellation Notice</h1>
          <p class="header-subtitle">Administrative Action Required</p>
        </div>
        
        <div class="content-section">
          <div class="priority-notice">
            <h3 class="priority-notice-title">Priority Administrative Notice</h3>
            <p class="priority-notice-text">A guest has initiated a booking cancellation requiring immediate attention for refund processing and administrative follow-up.</p>
          </div>
          
          ${cancellationReason ? `
          <div class="cancellation-reason">
            <h4 class="reason-header">Cancellation Details</h4>
            <p class="reason-text">"${cancellationReason}"</p>
          </div>
          ` : ''}
        
          <table class="booking-info-table">
            <tr>
              <th colspan="2">Cancelled Booking Information</th>
            </tr>
            <tr>
              <td><strong>Booking Reference</strong></td>
              <td>#${bookingDetails.bookingId}</td>
            </tr>
            <tr>
              <td><strong>Guest Name</strong></td>
              <td>${bookingDetails.guestName}</td>
            </tr>
            <tr>
              <td><strong>Check-in Date</strong></td>
              <td>${bookingDetails.checkIn}</td>
            </tr>
            <tr>
              <td><strong>Check-out Date</strong></td>
              <td>${bookingDetails.checkOut}</td>
            </tr>
            <tr>
              <td><strong>Party Size</strong></td>
              <td>${bookingDetails.guests} guests</td>
            </tr>
            <tr>
              <td><strong>Status</strong></td>
              <td><span class="status-tag">CANCELLED</span></td>
            </tr>
            <tr>
              <td><strong>Cancellation Time</strong></td>
              <td>${new Date().toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</td>
            </tr>
          </table>

          <div class="financial-section">
            <h3 class="financial-title">Financial Impact Summary</h3>
            <div class="financial-grid">
              <div class="financial-item">
                <div class="financial-label">Total Booking Value</div>
                <div class="financial-value amount-highlight">₱${bookingDetails.totalAmount.toLocaleString()}</div>
              </div>
              <div class="financial-item">
                <div class="financial-label">Revenue Status</div>
                <div class="financial-value">Cancelled</div>
              </div>
            </div>
          </div>
          
          <table class="booking-info-table">
            <tr>
              <th colspan="2">Guest Contact Information</th>
            </tr>
            <tr>
              <td><strong>Email Address</strong></td>
              <td>${bookingDetails.email}</td>
            </tr>
            <tr>
              <td><strong>Recommended Action</strong></td>
              <td>Review cancellation and process refund if applicable</td>
            </tr>
          </table>
        
          <table class="booking-info-table">
            <tr>
              <th colspan="2">Administrative Actions Required</th>
            </tr>
            <tr>
              <td><strong>Priority Level</strong></td>
              <td><span class="status-tag">HIGH</span></td>
            </tr>
            <tr>
              <td><strong>Admin Panel</strong></td>
              <td><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/bookings" style="color: #2b6cb0; text-decoration: none;">View Booking Details</a></td>
            </tr>
            <tr>
              <td><strong>Guest Contact</strong></td>
              <td><a href="mailto:${bookingDetails.email}" style="color: #2b6cb0; text-decoration: none;">Send Email</a></td>
            </tr>
          </table>
          
          <div style="background: #f8fafc; padding: 20px; margin: 20px 0; border-left: 4px solid #2b6cb0;">
            <h4 style="color: #2b6cb0; margin: 0 0 15px 0;">Administrative Checklist</h4>
            <ul style="margin: 0; padding-left: 20px; color: #2d3748;">
              <li>Review and process any applicable refunds</li>
              <li>Update property availability calendar</li>
              <li>Document cancellation reason for future reference</li>
              <li>Consider follow-up communication with guest</li>
              <li>Update revenue reports and forecasting</li>
            </ul>
          </div>
          
          <div style="background: #2b6cb0; color: white; padding: 20px; margin-top: 30px; text-align: center;">
            <div style="font-weight: 600; margin-bottom: 5px;">Kampo Ibayo Resort</div>
            <div style="font-size: 12px; opacity: 0.9;">Administrative Management System</div>
            <div style="font-size: 11px; margin-top: 10px; opacity: 0.8;">
              © 2025 Kampo Ibayo Resort. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: (process.env.ADMIN_EMAIL || process.env.EMAIL_FROM) as string,
    subject: `Guest Cancellation Alert: Booking ${bookingDetails.bookingId} - ${bookingDetails.guestName}`,
    html,
  };
};

// Enhanced Admin-Initiated Cancellation Email (Guest Notification)
export const createAdminCancellationGuestEmail = (cancellationData: CancellationEmailData): EmailTemplate => {
  const { refundDetails } = cancellationData;
  const hasRefund = refundDetails && refundDetails.refundAmount > 0;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancellation Notice - Kampo Ibayo Resort</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #2d3748;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background: #f7fafc;
        }
        .container {
          background: white;
          margin: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #2b6cb0, #1e40af);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .company-logo {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: 1px;
          color: white;
        }
        .cancellation-status {
          background: rgba(220, 38, 38, 0.2);
          color: #dc2626;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin: 15px 0;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid #dc2626;
        }
        .header-title {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin: 10px 0;
        }
        .header-subtitle {
          color: #93c5fd;
          font-size: 14px;
          margin: 0;
        }
        .content-section {
          padding: 30px;
        }
        .refund-section {
          background: #f0f9ff;
          border: 1px solid #38a169;
          padding: 20px;
          margin: 20px 0;
        }
        .refund-title {
          color: #38a169;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 15px 0;
        }
        .booking-info-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        .booking-info-table th {
          background: #2b6cb0;
          color: white;
          padding: 12px 15px;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid #e2e8f0;
        }
        .booking-info-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e2e8f0;
          color: #2d3748;
        }
        .booking-info-table tr:nth-child(even) {
          background: white;
        }
        .booking-info-table tr:nth-child(odd) {
          background: #f8fafc;
        }
        .amount-highlight {
          color: #38a169;
          font-weight: 700;
          font-size: 18px;
        }
        .contact-section {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .btn {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 8px;
        }
        .btn-green { background: #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-logo">KAMPO IBAYO RESORT</div>
          <div class="cancellation-status">BOOKING CANCELLED</div>
          <h1 class="header-title">Booking Cancellation Notice</h1>
          <p class="header-subtitle">Administrative Cancellation</p>
        </div>

        <div class="content-section">
          <p style="margin-bottom: 20px; color: #2d3748;">
            Dear ${cancellationData.guestName},
          </p>
          
          <p style="color: #2d3748; margin-bottom: 20px;">
            We regret to inform you that your booking reservation has been cancelled due to operational requirements. 
            We sincerely apologize for any inconvenience this cancellation may cause and appreciate your understanding.
          </p>
        
          ${cancellationData.cancellationReason ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #2d3748;"><strong>Cancellation Details:</strong> ${cancellationData.cancellationReason}</p>
          </div>
          ` : ''}

          ${hasRefund ? `
          <div class="refund-section">
            <h3 class="refund-title">Refund Processing Information</h3>
            <table class="booking-info-table">
              <tr>
                <th colspan="2">Refund Summary</th>
              </tr>
              <tr>
                <td><strong>Down Payment Paid</strong></td>
                <td>₱${refundDetails!.downPayment.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Refund Amount</strong></td>
                <td class="amount-highlight">₱${refundDetails!.refundAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Refund Percentage</strong></td>
                <td>${refundDetails!.refundPercentage}%</td>
              </tr>
              <tr>
                <td><strong>Processing Time</strong></td>
                <td>${refundDetails!.processingDays}</td>
              </tr>
              <tr>
                <td><strong>Refund Method</strong></td>
                <td>Original Payment Method</td>
              </tr>
            </table>
          </div>
          ` : ''}

          <table class="booking-info-table">
            <tr>
              <th colspan="2">Cancelled Booking Information</th>
            </tr>
            <tr>
              <td><strong>Booking Reference</strong></td>
              <td>#${cancellationData.bookingId}</td>
            </tr>
            <tr>
              <td><strong>Guest Name</strong></td>
              <td>${cancellationData.guestName}</td>
            </tr>
            <tr>
              <td><strong>Check-in Date</strong></td>
              <td>${cancellationData.checkIn}</td>
            </tr>
            <tr>
              <td><strong>Check-out Date</strong></td>
              <td>${cancellationData.checkOut}</td>
            </tr>
            <tr>
              <td><strong>Party Size</strong></td>
              <td>${cancellationData.guests} guests</td>
            </tr>
            <tr>
              <td><strong>Total Booking Value</strong></td>
              <td>₱${cancellationData.totalAmount.toLocaleString()}</td>
            </tr>
          </table>

          <div style="background: #f8fafc; padding: 20px; margin: 20px 0; border-left: 4px solid #2b6cb0;">
            <h4 style="color: #2b6cb0; margin: 0 0 15px 0;">Customer Service</h4>
            <p style="color: #2d3748; margin: 0 0 15px 0;">
              We sincerely apologize for this inconvenience and would be happy to assist you with future reservations or alternative arrangements.
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; width: 120px;"><strong>Phone:</strong></td>
                <td style="padding: 5px 0;"><a href="tel:+639662815123" style="color: #2b6cb0; text-decoration: none;">+63 966 281 5123</a></td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Email:</strong></td>
                <td style="padding: 5px 0;"><a href="mailto:kampoibayo@gmail.com" style="color: #2b6cb0; text-decoration: none;">kampoibayo@gmail.com</a></td>
              </tr>
            </table>
          </div>
          
          <div style="background: #2b6cb0; color: white; padding: 20px; margin-top: 30px; text-align: center;">
            <div style="font-weight: 600; margin-bottom: 5px;">Kampo Ibayo Resort</div>
            <div style="font-size: 12px; opacity: 0.9;">Professional Resort Management</div>
            <div style="font-size: 11px; margin-top: 10px; opacity: 0.8;">
              © 2025 Kampo Ibayo Resort. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: cancellationData.email,
    subject: `Booking Cancellation Notice - Kampo Ibayo Resort (Reference #${cancellationData.bookingId})`,
    html,
  };
};

// Professional User Cancellation Confirmation Email
export const createUserCancellationConfirmationEmail = (cancellationData: CancellationEmailData): EmailTemplate => {
  const { refundDetails } = cancellationData;
  const hasRefund = refundDetails && refundDetails.refundAmount > 0;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cancellation Confirmation - Kampo Ibayo Resort</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #2d3748;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background: #f7fafc;
        }
        .container {
          background: white;
          margin: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .company-logo {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        .cancellation-status {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin: 16px 0;
          display: inline-block;
        }
        .refund-section {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          text-align: center;
        }
        .refund-amount {
          font-size: 36px;
          font-weight: 800;
          margin: 8px 0;
        }
        .payment-breakdown {
          background: #f0f9ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
        }
        .breakdown-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          padding: 8px 0;
        }
        .breakdown-total {
          border-top: 2px solid #3b82f6;
          font-weight: 700;
          font-size: 18px;
        }
        .booking-details {
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          border: 1px solid #e2e8f0;
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
        }
        .detail-label {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 600;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-logo">KAMPO IBAYO RESORT</div>
          <div class="cancellation-status">RESERVATION CANCELLED</div>
          <h1 style="margin: 10px 0; font-size: 20px;">Cancellation Confirmation</h1>
          <p style="margin: 0; color: #fecaca; font-size: 14px;">Reference Number: ${cancellationData.bookingId}</p>
        </div>
        
        <div class="content-section">
          <p>Dear ${cancellationData.guestName},</p>
          
          <p>This email confirms that your reservation has been successfully cancelled as requested. We have processed your cancellation in accordance with our cancellation policy.</p>
          
          ${cancellationData.cancellationReason ? `
          <div style="background: #edf2f7; border: 1px solid #cbd5e0; padding: 15px; margin: 20px 0;">
            <strong>Cancellation Reason:</strong><br>
            ${cancellationData.cancellationReason}
          </div>
          ` : ''}

          
          <div class="cancellation-summary">
            <h3 class="section-title">Cancelled Reservation Details</h3>
            
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Confirmation Number</div>
                <div class="detail-value">${cancellationData.bookingId}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Guest Name</div>
                <div class="detail-value">${cancellationData.guestName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Original Check-in</div>
                <div class="detail-value">${cancellationData.checkIn}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Original Check-out</div>
                <div class="detail-value">${cancellationData.checkOut}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Number of Guests</div>
                <div class="detail-value">${cancellationData.guests} Guest(s)</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Cancellation Date</div>
                <div class="detail-value">${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
          </div>
          
          ${hasRefund ? `
          <div class="refund-section">
            <h3 class="section-title">Refund Information</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr style="background: #f7fafc;">
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Original Booking Amount:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">₱${cancellationData.totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Down Payment (Paid):</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">₱${refundDetails!.downPayment.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Balance (Pay on Arrival):</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">₱${(cancellationData.totalAmount - refundDetails!.downPayment).toLocaleString()}</td>
              </tr>
              <tr style="background: #f0fff4;">
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #2f855a;">Refund Amount (${refundDetails!.refundPercentage}%):</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #2f855a;">₱${refundDetails!.refundAmount.toLocaleString()}</td>
              </tr>
            </table>
            
            <p style="margin: 15px 0; color: #2f855a; font-weight: 600;">
              <strong>Processing Time:</strong> Your refund will be processed within ${refundDetails!.processingDays} to your original payment method.
            </p>
          </div>
          ` : `
          <div class="no-refund-section">
            <h3 class="section-title">Payment Information</h3>
            <p style="color: #c53030; font-weight: 600; margin: 0;">
              Based on our cancellation policy and the timing of your cancellation, no refund is applicable for this reservation.
            </p>
          </div>
          `}

        <div class="booking-details">
          <h3 style="color: #1f2937; margin: 0 0 16px 0;">📋 Cancelled Booking Details</h3>
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Booking ID</div>
              <div class="detail-value">#${cancellationData.bookingId}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Guest Name</div>
              <div class="detail-value">${cancellationData.guestName}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-in Date</div>
              <div class="detail-value">${cancellationData.checkIn}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-out Date</div>
              <div class="detail-value">${cancellationData.checkOut}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Number of Guests</div>
              <div class="detail-value">${cancellationData.guests} guests</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Cancellation Date</div>
              <div class="detail-value">${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</div>
            </div>
          </div>
        </div>
        
        <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <h4 style="color: #166534; margin: 0 0 12px 0;">🌟 We Hope to See You Again!</h4>
          <p style="color: #166534; margin: 0 0 16px 0;">
            While we're sorry to see this booking cancelled, we'd love to welcome you to Kampo Ibayo in the future.
          </p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/book" 
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 8px;">
            🏖️ Book Again
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0;"><strong>Kampo Ibayo Resort</strong></p>
          <p style="color: #9ca3af; font-size: 14px; margin: 4px 0 0 0;">Thank you for your understanding.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: cancellationData.email,
    subject: `Cancellation Confirmed - Kampo Ibayo Resort (Booking #${cancellationData.bookingId})`,
    html,
  };
};