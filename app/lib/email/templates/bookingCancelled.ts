import type { BookingDetails, EmailTemplate } from '../emailClient';
import { escapeHtml } from '@/app/utils/escapeHtml';

// Booking cancellation email template (when admin cancels booking)
export const createBookingCancelledEmail = (bookingDetails: BookingDetails): EmailTemplate => {
  const safe = {
    guestName: escapeHtml(String(bookingDetails.guestName)),
    bookingId: escapeHtml(String(bookingDetails.bookingId)),
    checkIn: escapeHtml(String(bookingDetails.checkIn)),
    checkOut: escapeHtml(String(bookingDetails.checkOut)),
  };
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

        <p>Dear ${safe.guestName},</p>

        <p>We regret to inform you that your booking has been cancelled due to unforeseen circumstances. We sincerely apologize for any inconvenience this may cause and understand how disappointing this news must be.</p>

        <div class="booking-details">
          <h3 class="details-title">
            <span>📋</span>
            Cancelled Booking Details
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
              <div class="detail-label">Original Check-in</div>
              <div class="detail-value">${safe.checkIn}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Original Check-out</div>
              <div class="detail-value">${safe.checkOut}</div>
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
            If you have made any payments for this booking, our team will review your refund based on our cancellation policy.
            You will be contacted regarding the refund process and timeline.
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
            <li><strong>Reschedule for different dates</strong> — subject to availability</li>
            <li><strong>Rebook in the future</strong> — we'd love to welcome you another time</li>
            <li><strong>Contact us</strong> — our team is happy to assist with any questions</li>
          </ul>
        </div>

        <div class="contact-info">
          <h4 class="contact-title">
            <span>🤝</span>
            Let's Discuss Your Options
          </h4>
          <div class="contact-details">
            <p style="margin: 8px 0;"><strong>📧 Email:</strong> info@kampoibayo.com</p>
            <p style="margin: 8px 0;"><strong>📞 Phone:</strong> +63 966 281 5123</p>
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
          <p>&copy; ${new Date().getFullYear()} Kampo Ibayo Resort. All rights reserved.</p>
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
