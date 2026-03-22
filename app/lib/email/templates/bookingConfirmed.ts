import type { BookingDetails, EmailTemplate } from '../emailClient';
import { escapeHtml } from '@/app/utils/escapeHtml';

// Booking confirmation email template (when admin confirms pending booking)
export const createBookingConfirmedEmail = (bookingDetails: BookingDetails): EmailTemplate => {
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

        <p>Dear ${safe.guestName},</p>

        <p><strong>Fantastic news!</strong> Your booking has been reviewed and confirmed by our team. We're absolutely excited to welcome you to Kampo Ibayo Resort and provide you with an unforgettable experience!</p>

        <div class="booking-details">
          <h3 class="details-title">
            <span>📋</span>
            Confirmed Booking Details
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
            <li><strong>Payment:</strong> ${bookingDetails.paymentType === 'full' ? 'Full payment completed — no balance upon arrival' : bookingDetails.paymentType === 'half' ? 'Remaining 50% balance due upon arrival' : 'Full payment required upon arrival'}</li>
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
            <p style="margin: 8px 0;"><strong>📞 Phone:</strong> +63 966 281 5123</p>
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
          <p>&copy; ${new Date().getFullYear()} Kampo Ibayo Resort. All rights reserved.</p>
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
