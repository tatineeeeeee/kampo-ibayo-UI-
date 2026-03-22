import type { BookingDetails, EmailTemplate } from '../emailClient';
import { escapeHtml } from '@/app/utils/escapeHtml';

// Professional booking confirmation email template
export const createBookingConfirmationEmail = (bookingDetails: BookingDetails): EmailTemplate => {
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
          <div class="confirmation-status">BOOKING RECEIVED</div>
          <h1 class="header-title">Reservation Received</h1>
          <p class="header-subtitle">Thank you for choosing our resort</p>
        </div>

        <div class="content-section">
          <p>Dear ${safe.guestName},</p>

          <p>We have received your reservation request at Kampo Ibayo Resort. Please upload your proof of payment so we can process and confirm your booking.</p>

          <div class="booking-details">
            <h3 class="section-title">Reservation Summary</h3>

            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Confirmation Number</div>
                <div class="detail-value">${safe.bookingId}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Guest Name</div>
                <div class="detail-value">${safe.guestName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Check-in Date</div>
                <div class="detail-value">${safe.checkIn}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Check-out Date</div>
                <div class="detail-value">${safe.checkOut}</div>
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
                <td style="padding: 8px 0; color: #2d3748;">+63 966 281 5123</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Business Hours:</td>
                <td style="padding: 8px 0; color: #2d3748;">8:00 AM - 8:00 PM (Philippine Standard Time)</td>
              </tr>
            </table>
          </div>

          <div style="margin: 20px 0; padding: 15px; background: #bee3f8; border-left: 4px solid #3182ce; color: #2c5282;">
            <strong>Next Step:</strong><br>
            Please upload your proof of payment to complete your booking. Once verified by our team, you will receive a confirmation email with your check-in details. For any questions, contact us using the information provided above.
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
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Kampo Ibayo Resort. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    RESERVATION RECEIVED - KAMPO IBAYO RESORT

    Dear ${bookingDetails.guestName},

    We have received your reservation request at Kampo Ibayo Resort.

    RESERVATION DETAILS:
    Booking ID: ${bookingDetails.bookingId}
    Guest Name: ${bookingDetails.guestName}
    Check-in Date: ${bookingDetails.checkIn}
    Check-out Date: ${bookingDetails.checkOut}
    Number of Guests: ${bookingDetails.guests}
    Total Amount: ₱${bookingDetails.totalAmount.toLocaleString()}

    CONTACT INFORMATION:
    Email: info@kampoibayo.com
    Phone: +63 966 281 5123
    Business Hours: 8:00 AM - 8:00 PM (Philippine Time)

    Please upload your proof of payment to complete your booking.

    Kampo Ibayo Resort
    © ${new Date().getFullYear()} All rights reserved.
  `;

  return {
    to: bookingDetails.email,
    subject: `Reservation Received - Booking ${bookingDetails.bookingId} | Kampo Ibayo Resort`,
    html,
    text,
  };
};
