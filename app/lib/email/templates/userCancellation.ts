import type { BookingDetails, EmailTemplate } from '../emailClient';
import { escapeHtml } from '@/app/utils/escapeHtml';

// User-initiated cancellation email template (guest confirmation)
export const createUserCancellationEmail = (bookingDetails: BookingDetails): EmailTemplate => {
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

        <p>Dear ${safe.guestName},</p>

        <p>We've successfully processed your booking cancellation. While we're sorry to see your plans change, we understand that sometimes these things happen and we're here to help make the process as smooth as possible.</p>

        <div class="booking-summary">
          <h3 class="summary-title">
            <span>📋</span>
            Cancelled Booking Summary
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
            <li><strong>Refund Review:</strong> If you made any payments, our team will review your refund based on our cancellation policy</li>
            <li><strong>We'll Be in Touch:</strong> You will be contacted regarding refund details and timeline</li>
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
            <p style="margin: 8px 0;"><strong>📞 Phone:</strong> +63 966 281 5123</p>
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
          <a href="tel:+639662815123" class="btn btn-success">
            <span>📞</span>
            Call Us
          </a>
        </div>

        <p><strong style="color: #059669;">💡 Want to visit us another time?</strong><br>
        We'd love to welcome you to Kampo Ibayo Resort in the future! Check our website for special offers and available dates that might work better for your schedule.</p>

        <div class="footer">
          <p><strong>Thank you for considering Kampo Ibayo Resort</strong></p>
          <p>We hope to welcome you in the future for an unforgettable experience!</p>
          <p>&copy; ${new Date().getFullYear()} Kampo Ibayo Resort. All rights reserved.</p>
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
