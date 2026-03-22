import type { BookingDetails, EmailTemplate } from '../emailClient';
import { escapeHtml } from '@/app/utils/escapeHtml';

// Admin notification email template
export const createAdminNotificationEmail = (bookingDetails: BookingDetails): EmailTemplate => {
  const safe = {
    guestName: escapeHtml(String(bookingDetails.guestName)),
    bookingId: escapeHtml(String(bookingDetails.bookingId)),
    checkIn: escapeHtml(String(bookingDetails.checkIn)),
    checkOut: escapeHtml(String(bookingDetails.checkOut)),
    email: escapeHtml(String(bookingDetails.email)),
  };
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
              <div class="detail-value">#${safe.bookingId}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Guest Name</div>
              <div class="detail-value">${safe.guestName}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-in Date</div>
              <div class="detail-value">${safe.checkIn}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-out Date</div>
              <div class="detail-value">${safe.checkOut}</div>
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
          <div class="contact-email">${safe.email}</div>
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
          <a href="mailto:${safe.email}" class="btn btn-success">
            <span>📧</span>
            Contact Guest
          </a>
        </div>

        <div class="footer">
          <p><strong>Kampo Ibayo Resort Admin Panel</strong></p>
          <p>This notification was sent automatically from your booking management system.</p>
          <p>&copy; ${new Date().getFullYear()} Kampo Ibayo Resort. All rights reserved.</p>
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
